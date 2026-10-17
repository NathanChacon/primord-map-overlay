"""Generate the Primord sonar PNG preview and Windows ICO."""

from math import ceil, cos, pi, sin
from pathlib import Path
import struct
import zlib


OUT = Path(__file__).parent
BACKGROUND = (16, 26, 37, 255)
MINT = (121, 224, 193, 255)
ACCENT = (255, 191, 105, 255)
RING_COLORS = (
    (41, 73, 90, 255),
    (48, 98, 115, 255),
    (57, 123, 131, 255),
)
SCALE = 4


def rounded_square_points(size, radius, corner_steps=12):
    points = []
    corners = [
        (size - radius, radius, -pi / 2),
        (size - radius, size - radius, 0),
        (radius, size - radius, pi / 2),
        (radius, radius, pi),
    ]
    for cx, cy, start in corners:
        for step in range(corner_steps + 1):
            angle = start + (pi / 2) * step / corner_steps
            points.append((cx + radius * cos(angle), cy + radius * sin(angle)))
    return points


def fill_polygon(buffer, width, height, polygon, color):
    if len(polygon) < 3:
        return
    y_min = max(0, int(min(point[1] for point in polygon)))
    y_max = min(height, ceil(max(point[1] for point in polygon)))
    row_color_cache = {}
    for y in range(y_min, y_max):
        scan_y = y + 0.5
        intersections = []
        for index, (x1, y1) in enumerate(polygon):
            x2, y2 = polygon[(index + 1) % len(polygon)]
            if (y1 <= scan_y < y2) or (y2 <= scan_y < y1):
                intersections.append(x1 + (scan_y - y1) * (x2 - x1) / (y2 - y1))
        intersections.sort()
        row_start = y * width * 4
        for index in range(0, len(intersections) - 1, 2):
            left = max(0, ceil(intersections[index] - 0.5))
            right = min(width, ceil(intersections[index + 1] - 0.5))
            if right > left:
                count = right - left
                row = row_color_cache.setdefault(count, bytes(color) * count)
                start = row_start + left * 4
                buffer[start : start + len(row)] = row


def scale_polygon(points, scale):
    return [(x * scale, y * scale) for x, y in points]


def circle_points(cx, cy, radius, steps=256):
    return [
        (cx + radius * cos(2 * pi * step / steps),
         cy + radius * sin(2 * pi * step / steps))
        for step in range(steps)
    ]


def make_png(size):
    high_size = size * SCALE
    scale = high_size / 256
    pixels = bytearray(high_size * high_size * 4)

    fill_polygon(pixels, high_size, high_size,
                 scale_polygon(rounded_square_points(256, 54), scale), BACKGROUND)

    # Concentric sonar rings with a sweep line and two highlighted pings.
    for radius, color in zip((108, 76, 44), RING_COLORS):
        fill_polygon(pixels, high_size, high_size,
                     scale_polygon(circle_points(128, 128, radius + 1.5), scale), color)
        fill_polygon(pixels, high_size, high_size,
                     scale_polygon(circle_points(128, 128, radius - 1.5), scale), BACKGROUND)

    # Subtle sweep line from the center to the detected point.
    fill_polygon(pixels, high_size, high_size,
                 scale_polygon([(127.2, 127.2), (128.8, 128.8),
                                (197.8, 59.8), (196.2, 58.2)], scale), MINT)
    fill_polygon(pixels, high_size, high_size,
                 scale_polygon(circle_points(128, 128, 13), scale), RING_COLORS[0])
    fill_polygon(pixels, high_size, high_size,
                 scale_polygon(circle_points(128, 128, 8), scale), MINT)
    fill_polygon(pixels, high_size, high_size,
                 scale_polygon(circle_points(197, 59, 10), scale), RING_COLORS[0])
    fill_polygon(pixels, high_size, high_size,
                 scale_polygon(circle_points(197, 59, 6), scale), ACCENT)

    result = bytearray(size * size * 4)
    samples = SCALE * SCALE
    for y in range(size):
        for x in range(size):
            sums = [0, 0, 0, 0]
            for sy in range(SCALE):
                start = (((y * SCALE + sy) * high_size) + x * SCALE) * 4
                for sx in range(SCALE):
                    offset = start + sx * 4
                    for channel in range(4):
                        sums[channel] += pixels[offset + channel]
            target = (y * size + x) * 4
            result[target : target + 4] = bytes((value + samples // 2) // samples for value in sums)
    return encode_png(size, size, result)


def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def encode_png(width, height, rgba):
    rows = b"".join(
        b"\0" + rgba[y * width * 4 : (y + 1) * width * 4]
        for y in range(height)
    )
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(rows, 9))
        + png_chunk(b"IEND", b"")
    )


def make_ico(images):
    directory = bytearray(struct.pack("<HHH", 0, 1, len(images)))
    offset = 6 + len(images) * 16
    for size, png_data in images:
        dimension = 0 if size == 256 else size
        directory.extend(struct.pack(
            "<BBBBHHII", dimension, dimension, 0, 0, 1, 32, len(png_data), offset
        ))
        offset += len(png_data)
    return bytes(directory) + b"".join(png_data for _, png_data in images)


def main():
    sizes = (16, 24, 32, 48, 64, 128, 256)
    images = [(size, make_png(size)) for size in sizes]
    (OUT / "icon.ico").write_bytes(make_ico(images))
    (OUT / "icon.png").write_bytes(make_png(512))
    print("Created assets/icon.ico and assets/icon.png")


if __name__ == "__main__":
    main()
