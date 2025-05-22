import math
import subprocess
import threading

from flask import Flask, request, make_response
import numpy as np
from waitress import serve

soapy_power_lock = threading.Lock()
app = Flask(__name__)

CROP_PERCENT = 30
GAIN = 30
FFT_BINS = 32
SOAPY_POWER_TIMEOUT = 8


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


@app.route("/power", methods=["POST"])
def data():
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
        return api_response({"error": " start_mhz must be between 1 and 2000 mhz"}, 500)
    if end_mhz < 1 or end_mhz > 2000:
        return api_response({"error": " start_mhz must be between 1 and 2000 mhz"}, 500)
    if start_mhz > end_mhz:
        return api_response({"error": " start_mhz must be below end_mhz"}, 500)
    if bandwidth_mhz < 1 or bandwidth_mhz > 20:
        return api_response(
            {"error": " bandwidth_mhz must be between 1 and 20 mhz"}, 500
        )

    print(f"Running soapy power {start_mhz}MHz:{end_mhz}MHz {bandwidth_mhz}MHz")

    try:
        soapy_power_cmd = [
            "soapy_power",
            "-k",
            f"{CROP_PERCENT}",
            "-f",
            f"{start_mhz}M:{end_mhz}M",
            "-r",
            f"{bandwidth_mhz}M",
            "-g",
            f"{GAIN}",
            "-D",
            "constant",
            "-b",
            f"{FFT_BINS}",
            "--fft-window",
            "bartlett",
        ]

        with soapy_power_lock:
            result = subprocess.run(
                soapy_power_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                timeout=SOAPY_POWER_TIMEOUT,
            )

        bins = np.arange(start_mhz, end_mhz, bandwidth_mhz)
        bin_lin_power_totals = np.zeros_like(bins, dtype=np.float32)
        bin_counts = np.zeros_like(bins, dtype=np.uint)

        lines = result.stdout.splitlines()

        if len(lines) == 0:
            raise RuntimeError("No data from soapy power")

        for line in lines:

            parts = line.split(",")

            fft_start_mhz = float(parts[2]) * 1e-6
            fft_step_mhz = float(parts[4]) * 1e-6

            for i, power in enumerate(parts[6:]):
                freq = fft_start_mhz + (i + 0.5) * fft_step_mhz

                b = np.digitize(freq, bins) - 1

                if b < len(bins):
                    bin_lin_power_totals[b] += math.pow(10, float(power) / 10)
                    bin_counts[b] += 1

        bin_lin_powers = bin_lin_power_totals / bin_counts
        bin_powers = 10 * np.log10(bin_lin_powers)

        data = []
        for i in range(0, len(bins)):
            freq = round(float(bins[i]) + bandwidth_mhz / 2, 3)
            power = round(float(bin_powers[i]), 3)

            if not math.isnan(power) and freq < end_mhz:
                data.append(
                    {
                        "freq_mhz": freq,
                        "power_dbm": power,
                    }
                )

                print(f"{freq}MHz: {power}dBm")

        return api_response(data)

    except Exception as e:
        print(f"Error: {e}")

        return api_response({"error": f"{e}"}, 500)


if __name__ == "__main__":
    serve(app, host="0.0.0.0", port=8080)
