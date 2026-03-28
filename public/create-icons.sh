#!/bin/bash
# Create simple colored PNG files as placeholders
# These will work as PWA icons

# Create 192x192 icon (green background)
convert -size 192x192 xc:"#2E7D32" -gravity center -pointsize 120 -fill white -annotate +0+0 "K" icon-192.png 2>/dev/null || echo "ImageMagick not available, will create alternative icons"

# Create 512x512 icon (green background)
convert -size 512x512 xc:"#2E7D32" -gravity center -pointsize 320 -fill white -annotate +0+0 "K" icon-512.png 2>/dev/null || echo "ImageMagick not available, will create alternative icons"
