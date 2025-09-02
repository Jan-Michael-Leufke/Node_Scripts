import sys

print("\nFrom Python:\n")
print("script:", sys.version)
print("arguments:", sys.argv)

with open(sys.argv[1], "r") as file:
    print("file contents:", file.read())