# Use an official lightweight Debian-based image

FROM debian:latest

# Update package lists and install dependencies

RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    soapysdr-tools soapysdr-module-all patch python3-numpy swig \
    librtlsdr-dev rtl-sdr \
    git wget cmake g++ pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Clone SoapySDR and build it

RUN git clone --recursive https://github.com/pothosware/SoapySDR.git \
    && cd SoapySDR \
    && mkdir build \
    && cd build \
    && cmake -DCMAKE_INSTALL_PREFIX:PATH=/opt/venv .. \
    && make -j$(nproc) \
    && make install \
    && ldconfig \
    && cd ~ \
    && rm -fr /SoapySDR

RUN git clone https://github.com/pothosware/SoapyRemote.git \
    && cd SoapyRemote \
    && mkdir build \
    && cd build \
    && cmake  -DCMAKE_INSTALL_PREFIX:PATH=/opt/venv  .. \
    && make \
    && make install \
    && cd ~ \
    && rm -fr /SoapyRemote

# Create and activate a virtual environment

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install required Python packages

RUN pip install --no-cache-dir numpy SimpleSoapy SimpleSpectral

# Install optional packages

RUN pip install --no-cache-dir pyFFTW scipy
RUN pip install --no-cache-dir urllib3 requests scipy flask waitress dotenv
 
# Install soapy_power via pip

COPY dora.py /dora.py
COPY sdrs.json /sdrs.json


RUN pip install soapy_power
RUN ln  -s /opt/venv/lib/libSoapySDR.so.0.8-3 /usr/lib/x86_64-linux-gnu/libSoapySDR.so.0.8-3


# Lower MTU of Remote Soapy SDRs Packets - Due to Poential issues with VPNs....

COPY power-py.patch  /power-py.patch
RUN patch -p1 /opt/venv/lib/python3.11/site-packages/soapypower/power.py </power-py.patch

# Default command
CMD ["python3","/dora.py"]
