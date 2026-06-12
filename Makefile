PYTHON ?= python3.14

.PHONY: help \
	install install-sip install-a18 install-a23 \
	start-sip start-a18 start-a18-v2 start-a23 \
	clean

help:
	@echo "Available commands:"
	@echo ""
	@echo "Install:"
	@echo "  make install"
	@echo "  make install-sip"
	@echo "  make install-a18"
	@echo "  make install-a23"
	@echo ""
	@echo "Run:"
	@echo "  make start-sip"
	@echo "  make start-a18"
	@echo "  make start-a18-v2"
	@echo "  make start-a23"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean"

install: install-sip install-a18 install-a23

install-sip:
	cd sip && npm install

install-a18:
	cd whisper/asterisk18 && \
	rm -rf .venv && \
	$(PYTHON) -m venv .venv && \
	. .venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt && \
	npm install

install-a23:
	cd whisper/asterisk23 && \
	rm -rf .venv && \
	$(PYTHON) -m venv .venv && \
	. .venv/bin/activate && \
	pip install --upgrade pip && \
	pip install -r requirements.txt

start-sip:
	cd sip && npm start

start-a18:
	cd whisper/asterisk18 && \
	. .venv/bin/activate && \
	python transcriber.py

start-a18-v2:
	cd whisper/asterisk18 && \
	. .venv/bin/activate && \
	python transcriber-v2.py

start-a23:
	cd whisper/asterisk23 && \
	. .venv/bin/activate && \
	python server.py

clean:
	rm -rf whisper/asterisk18/.venv
	rm -rf whisper/asterisk23/.venv