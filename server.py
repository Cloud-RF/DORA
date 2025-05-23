import curses
import json
import math
import signal
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import urllib3
from flask import Flask, request, make_response
from waitress import serve

CONFIG_FILE = "config.json"
DATA_COLLECTION_INTERVAL_S = 5

REQUEST_TIMEOUT_S = 10
REQUEST_VERIFY_SSL = True

data = []
data_lock = threading.Lock()
config_lock = threading.Lock()
app = Flask(__name__)

win = None
log_win = None

log = []

COLOR_RED = 1
COLOR_YELLOW = 2
COLOR_GREEN = 3

CLOUDRF_NOISE_MAX = -20
CLOUDRF_NOISE_MIN = -144


def draw_log():
    global log

    win_height, win_width = log_win.getmaxyx()
    log_win.clear()
    log_win.box()

    max_log_len = win_height - 2
    if len(log) > max_log_len:
        log = log[-max_log_len:]

    def addstr(y, x, text, *args):
        if 0 <= y < win_height - 1 and 0 <= x < win_width - 1:
            max_size = win_width - x - 1
            log_win.addstr(y, x, text[: min(len(text), max_size)], *args)

    addstr(1, 2, "Logs / Messages")

    for i, message in enumerate(log):
        if "color" in message:
            addstr(2 + i, 2, message["text"], curses.color_pair(message["color"]))
        else:
            addstr(2 + i, 2, message["text"])

    log_win.refresh()


def log_msg(message, color=None):
    global log

    for line in message.splitlines():
        if color == None:
            log.append({"text": line})
        else:
            log.append({"text": line, "color": color})

    draw_log()


def api_response(data, status_code=200):
    response = make_response(data)
    response.status_code = status_code
    response.headers["Content-Type"] = "application/json"  # Set MIME type
    response.headers["Access-Control-Allow-Origin"] = "*"  # Allow all origins
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"  # Immediate expiration
    return response


@app.route("/data")
def data_endpoint():
    with data_lock, config_lock:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)

        log_msg(f"Data fetched. Origin: {request.origin if request.origin != None else 'unknown'}")

        return api_response(
            {
                "start_mhz": config["start_mhz"],
                "end_mhz": config["end_mhz"],
                "bandwidth_mhz": config["bandwidth_mhz"],
                "sdrs": data,
            }
        )


@app.route("/node/add", methods=["POST"])
def node_add_endpoint():
    request_data = request.json
    address = request_data.get("address").strip()
    latitude = float(request_data.get("latitude"))
    longitude = float(request_data.get("longitude"))

    if type(address) != str:
        return api_response({"error": "Invalid address must be string"}, 500)
    if type(latitude) != float:
        return api_response({"error": "Invalid latitude"}, 500)
    if type(longitude) != float:
        return api_response({"error": "Invalid longitude"}, 500)

    try:
        with config_lock:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)

            if "sdrs" not in config:
                config["sdrs"] = []

            sdr_found = False

            # If the SDR has already been added, update the position instead
            for i, sdr in enumerate(config["sdrs"]):
                if sdr["address"] == address:
                    config["sdrs"][i]["latitude"] = latitude
                    config["sdrs"][i]["longitude"] = longitude
                    sdr_found = True
                    break

            if not sdr_found:
                config["sdrs"].append(
                    {
                        "address": address,
                        "latitude": latitude,
                        "longitude": longitude,
                    }
                )

            with open(CONFIG_FILE, "w") as f:
                f.write(json.dumps(config))

        log_msg(f"Node {address} {'updated' if sdr_found else 'added'} by {request.origin if request.origin != None else 'unknown'}", COLOR_GREEN)

        return api_response("Node added successfully")

    except Exception as e:
        log_msg(f"Error: {e}", COLOR_RED)

        return api_response({"error": f"Unable to add/update node"}, 500)


@app.route("/node/remove", methods=["POST"])
def node_remove_endpoint():
    request_data = request.json

    address = request_data.get("address")

    if type(address) != str:
        return api_response({"error": "Invalid address must be string"}, 500)
    try:
        with config_lock, data_lock:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)

            new_data = []
            for d in data:
                if d["address"] != address:
                    new_data.append(d)

            new_sdrs = []
            for sdr in config["sdrs"]:
                if sdr["address"] != address:
                    new_sdrs.append(sdr)

            if len(new_data) == len(data) and len(new_sdrs) == len(config["sdrs"]):
                return api_response({"error": "Address not found"}, 500)

            config["sdrs"] = new_sdrs

            data.clear()
            data.extend(new_data)

            with open(CONFIG_FILE, "w") as f:
                f.write(json.dumps(config))

            log_msg(f"Node {address} removed by {request.origin if request.origin != None else 'unknown'}", COLOR_GREEN)

            return api_response("Node removed successfully")

    except Exception as e:
        log_msg(f"Error: {e}", COLOR_RED)

        return api_response({"error": f"Unable to remove node"}, 500)


@app.route("/tasking", methods=["POST"])
def tasking_endpoint():
    request_data = request.json

    start_mhz = request_data.get("start_mhz")
    end_mhz = request_data.get("end_mhz")
    bandwidth_mhz = request_data.get("bandwidth_mhz")

    # Frequencies and bandwidths must be ints. This is a wideband system
    if type(start_mhz) != int:
        return api_response({"error": "Invalid start_mhz"}, 500)
    if type(end_mhz) != int:
        return api_response({"error": "Invalid end_mhz"}, 500)
    if type(bandwidth_mhz) != int:
        return api_response({"error": "Invalid bandwidth_mhz"}, 500)

    # Ensure your SDR can do the frequency you want :O
    if start_mhz < 1 or start_mhz > 2000:
        return api_response({"error": "start_mhz must be between 1 and 2000 mhz"}, 500)
    if end_mhz < 1 or end_mhz > 2000:
        return api_response({"error": "end_mhz must be between 1 and 2000 mhz"}, 500)
    if start_mhz > end_mhz:
        return api_response({"error": "start_mhz must be below end_mhz"}, 500)
    if bandwidth_mhz < 1 or bandwidth_mhz > 20:
        return api_response(
            {"error": "bandwidth_mhz must be between 1 and 20 mhz"}, 500
        )

    try:
        with config_lock, data_lock:
            data.clear()

            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)

            config["start_mhz"] = start_mhz
            config["end_mhz"] = end_mhz
            config["bandwidth_mhz"] = bandwidth_mhz

            with open(CONFIG_FILE, "w") as f:
                f.write(json.dumps(config))

            log_msg(f"Tasking updated:", COLOR_GREEN)
            log_msg(f"      start_mhz    : {start_mhz}", COLOR_GREEN)
            log_msg(f"      end_mhz      : {start_mhz}", COLOR_GREEN)
            log_msg(f"      bandwidth_mhz: {bandwidth_mhz}", COLOR_GREEN)
            log_msg(f"      origin       : {request.origin if request.origin != None else 'unknown'}", COLOR_GREEN)

            return api_response("Tasking updated successfully")

    except Exception as e:
        log_msg(f"Error: {e}", COLOR_RED)

        return api_response({"error": "Unable to update tasking"}, 500)


def draw_output():
    win_height, win_width = win.getmaxyx()

    win.clear()
    win.box()

    data_col_size = 8

    with config_lock:
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)

    thermal_noise = -173.8 + 10 * math.log10(config["bandwidth_mhz"] * 1e6)

    # Wrap win.addstr to prevent writing text outside the window box
    def addstr(y, x, text, *args):
        if 0 <= y < win_height - 1 and 0 <= x < win_width - 1:
            max_size = win_width - x - 1
            win.addstr(y, x, text[: min(len(text), max_size)], *args)

    addstr(1, 2, f"Current Tasking:", curses.A_BOLD)
    addstr(
        1,
        22,
        f"{config['start_mhz']}Mhz - {config['end_mhz']}Mhz",
        curses.color_pair(COLOR_GREEN),
    )

    with data_lock:

        # Draw address column
        address_header = "SDR"
        addstr(3, 2, address_header, curses.A_BOLD)
        largest_address_len = len(address_header)
        for j, sdr in enumerate(data):
            addstr(4 + j, 2, sdr["address"], curses.A_BOLD)
            largest_address_len = max(largest_address_len, len(sdr["address"]))

        if len(data) > 0:

            # Draw freqeuncies
            for i, sdr_data in enumerate(data[0]["data"]):
                addstr(
                    3,
                    2 + largest_address_len + (i * data_col_size),
                    f"{sdr_data['frequency']:{data_col_size}.1f}",
                    curses.A_BOLD,
                )

            # Draw noise values
            for j, sdr in enumerate(data):
                for i, sdr_data in enumerate(sdr["data"]):

                    noise = int(sdr_data["noise"])

                    colorpair = COLOR_GREEN
                    if noise > thermal_noise + 10:
                        colorpair = COLOR_YELLOW
                    if noise > thermal_noise + 20:
                        colorpair = COLOR_RED

                    addstr(
                        4 + j,
                        2 + largest_address_len + (i * data_col_size),
                        f"{noise:{data_col_size}.0f}",
                        curses.color_pair(colorpair),
                    )

    win.refresh()


def serve_thread_fn():
    serve(app, host="0.0.0.0", port=8080)


def curses_main(stdscr):

    stdscr.keypad(True)

    curses.curs_set(0)
    stdscr.clear()

    def create_subwins():
        global log_win, win

        height, width = stdscr.getmaxyx()
        split = height // 2

        win = stdscr.subwin(split, width, 0, 0)
        win.clear()
        win.box()

        log_win = stdscr.subwin(height - split, width, split, 0)
        log_win.clear()
        log_win.box()

        stdscr.refresh()
        win.refresh()
        log_win.refresh()

        curses.start_color()
        curses.init_pair(COLOR_GREEN, curses.COLOR_GREEN, curses.COLOR_BLACK)
        curses.init_pair(COLOR_YELLOW, curses.COLOR_YELLOW, curses.COLOR_BLACK)
        curses.init_pair(COLOR_RED, curses.COLOR_RED, curses.COLOR_BLACK)

        draw_log()
        draw_output()

    def resize_handler(signum, frame):
        curses.endwin()
        stdscr.refresh()
        curses.resizeterm(*stdscr.getmaxyx())
        create_subwins()

    signal.signal(signal.SIGWINCH, resize_handler)

    create_subwins()

    while True:
        key = stdscr.getch()
        if key == ord("q"):
            break

    curses.nocbreak()
    stdscr.keypad(False)
    stdscr.refresh()
    curses.echo()


def collect(sdr, settings):
    try:
        response = requests.post(
            f"{sdr['address']}/power",
            json=settings,
            timeout=REQUEST_TIMEOUT_S,
            verify=REQUEST_VERIFY_SSL,
        )
        response_json = response.json()
        if "error" in response_json:
            raise RuntimeError(response_json["error"])
        response.raise_for_status()
        return False, sdr, response_json

    except Exception as e:
        return True, sdr, e


def collect_thread_fn():
    while True:

        with config_lock:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)

        settings = {
            "start_mhz": config["start_mhz"],
            "end_mhz": config["end_mhz"],
            "bandwidth_mhz": config["bandwidth_mhz"],
        }

        cloudrf_noise_data = []

        with ThreadPoolExecutor() as executor:

            futures = []
            if "sdrs" in config:
                for sdr in config["sdrs"]:
                    futures.append(executor.submit(collect, sdr, settings))

            for future in as_completed(futures):
                err, sdr, result = future.result()

                if err:
                    log_msg(
                        f"Error collection data from {sdr['address']}: {result}", COLOR_RED
                    )
                    continue

                # Re-fetch config to ensure we don't add data collected from nodes that have just been removed
                with config_lock, data_lock:
                    with open(CONFIG_FILE, "r") as f:
                        config = json.load(f)

                    found_in_config = False

                    for config_sdr in config["sdrs"]:
                        if config_sdr["address"] == sdr["address"]:
                            found_in_config = True

                    if not found_in_config:
                        continue

                    sdr_data = []
                    for d in result:
                        if (
                            d["freq_mhz"] < config["start_mhz"]
                            or d["freq_mhz"] > config["end_mhz"]
                        ):
                            continue

                        cloudrf_noise_data.append(
                            {
                                "frequency": d["freq_mhz"],
                                "latitude": sdr["latitude"],
                                "longitude": sdr["longitude"],
                                "noise": min(
                                    max(d["power_dbm"], CLOUDRF_NOISE_MIN),
                                    CLOUDRF_NOISE_MAX,
                                ),
                            }
                        )
                        sdr_data.append(
                            {"frequency": d["freq_mhz"], "noise": d["power_dbm"]}
                        )

                    existing_data_found = False

                    for i, existing_data in enumerate(data):
                        if existing_data["address"] == sdr["address"]:
                            data[i]["latitude"] = sdr["latitude"]
                            data[i]["longitude"] = sdr["longitude"]
                            data[i]["data"] = sdr_data
                            existing_data_found = True
                            break

                    if not existing_data_found:
                        data.append(
                            {
                                "address": sdr["address"],
                                "latitude": sdr["latitude"],
                                "longitude": sdr["longitude"],
                                "data": sdr_data,
                            }
                        )

                    log_msg(f"Succesfully collected data from {sdr['address']}")

        with config_lock:
            with open(CONFIG_FILE, "r") as f:
                config = json.load(f)

        if (
            "cloudrf_api" in config
            and "cloudrf_api_key" in config
            and len(cloudrf_noise_data) > 0
        ):
            try:
                response = requests.post(
                    f"{config['cloudrf_api']}/noise/create",
                    headers={
                        "key": config["cloudrf_api_key"],
                        "Accept": "application/json",
                    },
                    json=cloudrf_noise_data,
                    timeout=REQUEST_TIMEOUT_S,
                    verify=REQUEST_VERIFY_SSL,
                )
                response_json = response.json()
                if "error" in response_json:
                    raise RuntimeError(response_json["error"])
                response.raise_for_status()

                log_msg(
                    f"Succesfully posted {len(cloudrf_noise_data)} noise measurements to {config['cloudrf_api']}"
                )
            except Exception as e:
                log_msg(
                    f"Error posting measurements to {config['cloudrf_api']}: {e}", COLOR_RED
                )

        try:
            draw_output()
        except Exception as e:
            log_msg(f"Failed to draw output {e}", COLOR_RED)

        time.sleep(DATA_COLLECTION_INTERVAL_S)


if __name__ == "__main__":
    if not REQUEST_VERIFY_SSL:
        urllib3.disable_warnings()

    serve_thread = threading.Thread(target=serve_thread_fn, daemon=True)
    collect_thread = threading.Thread(target=collect_thread_fn, daemon=True)

    serve_thread.start()
    collect_thread.start()

    curses.wrapper(curses_main)
