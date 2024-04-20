'use strict';

if (typeof module !== 'undefined') module.exports = simpleheat;

function simpleheat(canvas) {
	if (!(this instanceof simpleheat)) return new simpleheat(canvas);

	this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

	this._ctx = canvas.getContext('2d');
	this._width = canvas.width;
	this._height = canvas.height;

	this._max = 1;
	this._r = 25;
	this._opacity = 1;
	this._data = [];
}

function HSVtoRGB(h, s, v) {
	var r, g, b, i, f, p, q, t;
	if (arguments.length === 1) {
		s = h.s, v = h.v, h = h.h;
	}
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255)
	};
}

simpleheat.prototype = {

	data: function (data) {
		this._data = data;
		return this;
	},

	max: function (max) {
		this._max = max;
		return this;
	},

	add: function (point) {
		this._data.push(point);
		return this;
	},

	clear: function () {
		this._data = [];
		return this;
	},

	radius: function (r) {
		this._r = r;
		return this;
	},

	opacity: function (opacity) {
		this._opacity = opacity;
		return this;
	},

	resize: function () {
		this._width = this._canvas.width;
		this._height = this._canvas.height;
	},

	draw: function () {
		var ctx = this._ctx;

		ctx.clearRect(0, 0, this._width, this._height);

		var grid = [];
		var sum = [];
		for (var x = 0; x < this._width; x++) {
			grid[x] = [];
			sum[x] = [];
			for (var y = 0; y < this._height; y++) {
				grid[x][y] = 0;
				sum[x][y] = 0;
			}
		}

		for (var i = 0, len = this._data.length, p; i < len; i++) {
			p = this._data[i];
			for (var x = p[0] - this._r; x < p[0] + this._r; ++x) {
				if (x < 0) continue;
				if (x >= this._width) continue;
				for (var y = p[1] - this._r; y < p[1] + this._r; ++y) {
					if (y < 0) continue;
					if (y >= this._height) continue;

					var dist = Math.sqrt((p[0] - x) * (p[0] - x) + (p[1] - y) * (p[1] - y));
					if (dist > this._r)
						continue;

					// TODO => loi gausienne
					var k = (1 - (dist / this._r));
					grid[x][y] += p[2] * k;
					sum[x][y] += k;
				}
			}
		}

		var min = Number.MAX_VALUE;
		var max = 0;
		for (var x = 0; x < this._width; x++) {
			for (var y = 0; y < this._height; y++) {
				if (sum[x][y] == 0) continue;

				min = Math.min(min, grid[x][y] / sum[x][y]);
				max = Math.max(max, grid[x][y] / sum[x][y]);
			}
		}

		var colored = ctx.getImageData(0, 0, this._width, this._height);
		for (var x = 0; x < this._width; x++) {
			for (var y = 0; y < this._height; y++) {
				if (sum[x][y] == 0) continue;

				var value = ((grid[x][y] / sum[x][y]) - min) / (max - min);
				var rgb = HSVtoRGB(Math.min(value, 1) / 3, 1, 1);

				var i = (y * this._width + x) * 4;
				colored.data[i + 0] = rgb.r;
				colored.data[i + 1] = rgb.g;
				colored.data[i + 2] = rgb.b;
				colored.data[i + 3] = this._opacity;
			}
		}

		ctx.putImageData(colored, 0, 0);

		return this;
	},

};