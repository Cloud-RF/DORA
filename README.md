# DORA

Distributed Open Receiver Array

## About

DORA is an API for collecting RF noise using SDRs. It was designed to support live noise collection for the CloudRF RF planning API.

It provides a scalable API and interface to task receivers and monitor RF spectrum noise in different locations. 

*It is an autonomous wideband monitoring capability with averaging so is not intended for signal detection or analysis but can be modified to perform up to the limit of the hardware and network*

## Design

DORA is built upon the open source [SoapySDR](https://github.com/pothosware/SoapySDR/wiki) library and wraps the [Soapy_power](https://github.com/xmikos/soapy_power) utility to interface with low cost SDRs to fetch FFT data. A popular business model.

Each SDR is a 'node' and needs to run the node.py script. 
This serves a REST API that, when called, runs soapy_power returns the requested PSD of noise, measured in dBm..

The server.py script collects data from the SDRs and posts it to the CloudRF [noise API](https://cloudrf.com/documentation/developer/#/Manage/noiseCreate) when an API key is provided, to support accurate SNR simulations using live data instead of arbitrary or old noise figures.

The REST API allows the system to be tasked, nodes to be added/removed and data to be fetched.

## Hardware

Only 12-bit or better resolution SDRs (Lime, SDRPlay, Ettus etc) are recommended. Low resolution 8-bit (RTL-2832, HackRF) SDRs are supported but cannot provide the resolution needed for noise measurements.

For a full list of supported SDRs, see the [SoapySDR wiki](https://github.com/pothosware/SoapySDR/wiki).

DORA was designed for SDRplay RSP1B 14-bit SDRs coupled with a Raspberry Pi4. The BOM for each node was < £200.

## Requirements

### node.py

 - python 3
 - [soapy_power](https://github.com/xmikos/soapy_power)
 - numpy
 - flask
 - waitress

### server.py
 - python 3
 - flask
 - waitress
 - requests
 - urllib3
