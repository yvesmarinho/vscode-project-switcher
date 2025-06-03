.PHONY: all build watch clean rebuild

all: build

build:
	npm install
	npm run compile

watch:
	npm run watch

clean:
	rm -rf out/

