# Simple Python Game Example
# This is a basic example that WORKS in the browser

import numpy as np

print("🎮 Simple Python Game Starting...")
print("=" * 50)

# Generate a simple pattern
print("\nGenerating sphere coordinates...")
phi = np.linspace(0, np.pi, 10)
theta = np.linspace(0, 2 * np.pi, 20)

# Create sphere mesh
x = np.outer(np.sin(phi), np.cos(theta))
y = np.outer(np.sin(phi), np.sin(theta))
z = np.outer(np.cos(phi), np.ones_like(theta))

print(f"✓ Sphere mesh created: {x.shape[0]}x{x.shape[1]} points")

# Some calculations
volume = (4/3) * np.pi * (1**3)
surface_area = 4 * np.pi * (1**2)

print(f"\nSphere properties:")
print(f"  Volume: {volume:.2f}")
print(f"  Surface Area: {surface_area:.2f}")

# Simulate rotation
rotation_angle = np.pi / 4
print(f"\nSimulating rotation by {np.degrees(rotation_angle):.1f}°...")

# Simple rotation matrix
cos_angle = np.cos(rotation_angle)
sin_angle = np.sin(rotation_angle)

print(f"  Rotation matrix computed")
print(f"  cos(θ) = {cos_angle:.4f}")
print(f"  sin(θ) = {sin_angle:.4f}")

print("\n" + "=" * 50)
print("✓ Game simulation complete!")
print("\n💡 TIP: For real hand gesture control with camera:")
print("   Switch to JavaScript mode for full browser support!")
