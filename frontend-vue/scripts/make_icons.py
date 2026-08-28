import zlib
import struct
import os

def create_solid_png(width, height, rgb_color):
    """
    Generates a valid, pixel-perfect solid color PNG image binary stream 
    using only Python standard library zlib and struct modules.
    """
    r, g, b = rgb_color
    # Each row starts with a filter byte (0 for None) followed by RGB pixel data
    row_data = bytes([0]) + bytes([r, g, b]) * width
    raw_img_data = row_data * height
    
    # Compress the raw pixel data using zlib
    compressed_data = zlib.compress(raw_img_data)
    
    def make_chunk(tag: bytes, data: bytes) -> bytes:
        # Chunk layout: Length (4 bytes) + Tag (4 bytes) + Data + CRC (4 bytes)
        length_bytes = struct.pack("!I", len(data))
        crc_val = zlib.crc32(tag + data) & 0xffffffff
        crc_bytes = struct.pack("!I", crc_val)
        return length_bytes + tag + data + crc_bytes

    # PNG File Signature
    png_signature = b"\x89PNG\r\n\x1a\n"
    
    # IHDR chunk: Width, Height, Bit Depth (8), Color Type (2 = RGB), Compression (0), Filter (0), Interlace (0)
    ihdr_data = struct.pack("!IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = make_chunk(b"IHDR", ihdr_data)
    
    # IDAT chunk (pixel data)
    idat_chunk = make_chunk(b"IDAT", compressed_data)
    
    # IEND chunk (end marker)
    iend_chunk = make_chunk(b"IEND", b"")
    
    return png_signature + ihdr_chunk + idat_chunk + iend_chunk

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    public_dir = os.path.join(script_dir, "..", "public")
    
    if not os.path.exists(public_dir):
        os.makedirs(public_dir, exist_ok=True)

    # #0f172a theme color in RGB decimal: R=15, G=23, B=42
    theme_color_rgb = (15, 23, 42)

    # Generate 192x192 PNG
    png_192 = create_solid_png(192, 192, theme_color_rgb)
    with open(os.path.join(public_dir, "pwa-192x192.png"), "wb") as f:
        f.write(png_192)

    # Generate 512x512 PNG
    png_512 = create_solid_png(512, 512, theme_color_rgb)
    with open(os.path.join(public_dir, "pwa-512x512.png"), "wb") as f:
        f.write(png_512)

    print("✅ Successfully generated solid #0f172a theme PWA icons (192x192 and 512x512) using python built-in modules!")

if __name__ == "__main__":
    main()
