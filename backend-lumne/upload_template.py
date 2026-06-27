import os
import sys
import zipfile
import urllib.request
import tempfile
import argparse
from pathlib import Path

try:
    from minio import Minio
except ImportError:
    print("Error: The 'minio' python library is required. Please install it using: pip install minio")
    sys.exit(1)

TEMPLATE_ZIP_URL = "https://github.com/rohitmsaxena/react-vite-tailwind-daisyui-starter/archive/refs/heads/main.zip"
TEMPLATE_DIR_NAME = "react-vite-tailwind-daisyui-starter-main"
TARGET_PREFIX = "react-vite-tailwind-daisyui-starter"
BUCKET_NAME = "starter-projects"

def main():
    parser = argparse.ArgumentParser(description="Upload React-Vite starter template to MinIO.")
    parser.add_argument("--url", default="localhost:9000", help="MinIO endpoint (default: localhost:9000)")
    parser.add_argument("--access-key", default="minioadmin", help="MinIO Access Key (default: minioadmin)")
    parser.add_argument("--secret-key", default="minioadmin123", help="MinIO Secret Key (default: minioadmin123)")
    parser.add_argument("--secure", action="store_true", help="Use HTTPS secure connection")
    
    args = parser.parse_args()
    
    # 1. Initialize MinIO Client
    print(f"Connecting to MinIO at {'https' if args.secure else 'http'}://{args.url} ...")
    try:
        client = Minio(
            args.url,
            access_key=args.access_key,
            secret_key=args.secret_key,
            secure=args.secure
        )
        # Verify connection by listing buckets
        client.list_buckets()
    except Exception as e:
        print(f"Failed to connect to MinIO: {e}")
        print("Please check your credentials, and make sure MinIO is running and accessible.")
        sys.exit(1)
        
    # 2. Ensure bucket exists
    try:
        if not client.bucket_exists(BUCKET_NAME):
            print(f"Creating bucket '{BUCKET_NAME}'...")
            client.make_bucket(BUCKET_NAME)
        else:
            print(f"Bucket '{BUCKET_NAME}' already exists.")
    except Exception as e:
        print(f"Failed to verify/create bucket: {e}")
        sys.exit(1)

    # 3. Download and Extract Template ZIP
    with tempfile.TemporaryDirectory() as tmpdir:
        zip_path = os.path.join(tmpdir, "template.zip")
        print(f"Downloading starter template from {TEMPLATE_ZIP_URL}...")
        try:
            urllib.request.urlretrieve(TEMPLATE_ZIP_URL, zip_path)
        except Exception as e:
            print(f"Failed to download template: {e}")
            sys.exit(1)
            
        print("Extracting template ZIP...")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(tmpdir)
        except Exception as e:
            print(f"Failed to extract ZIP: {e}")
            sys.exit(1)
            
        extracted_root = os.path.join(tmpdir, TEMPLATE_DIR_NAME)
        if not os.path.exists(extracted_root):
            print(f"Error: Extracted directory '{TEMPLATE_DIR_NAME}' not found.")
            sys.exit(1)

        # 3b. Modify package.json to add common dependencies
        package_json_path = os.path.join(extracted_root, "package.json")
        if os.path.exists(package_json_path):
            print("Modifying package.json to include lucide-react and other common dependencies...")
            import json
            try:
                with open(package_json_path, 'r') as f:
                    data = json.load(f)
                
                # Add dependencies
                if "dependencies" not in data:
                    data["dependencies"] = {}
                
                # Inject common AI packages
                data["dependencies"]["lucide-react"] = "^0.468.0"
                data["dependencies"]["recharts"] = "^2.15.0"
                data["dependencies"]["framer-motion"] = "^11.15.0"
                data["dependencies"]["clsx"] = "^2.1.1"
                data["dependencies"]["tailwind-merge"] = "^2.5.5"
                data["dependencies"]["canvas-confetti"] = "^1.9.3"
                
                # Write back
                with open(package_json_path, 'w') as f:
                    json.dump(data, f, indent=2)
                print("package.json successfully updated.")
            except Exception as e:
                print(f"Warning: Failed to modify package.json: {e}")

        # 4. Upload files to MinIO
        print("Uploading files to MinIO...")
        upload_count = 0
        for root, dirs, files in os.walk(extracted_root):
            for file in files:
                file_path = os.path.join(root, file)
                
                # Get clean path relative to extracted template root
                relative_path = os.path.relpath(file_path, extracted_root)
                
                # Skip system files like .DS_Store or git metadata
                if file.startswith('.') or '.git' in relative_path:
                    continue
                
                # Target key in MinIO
                dest_key = f"{TARGET_PREFIX}/{relative_path}"
                
                try:
                    # Upload file
                    client.fput_object(
                        BUCKET_NAME,
                        dest_key,
                        file_path
                    )
                    print(f"  Uploaded: {dest_key}")
                    upload_count += 1
                except Exception as e:
                    print(f"  Failed to upload {relative_path}: {e}")
                    
        print(f"\nSuccess! Successfully uploaded {upload_count} template files to MinIO.")
        print(f"Bucket: {BUCKET_NAME}")
        print(f"Folder Prefix: {TARGET_PREFIX}/")

if __name__ == "__main__":
    main()
