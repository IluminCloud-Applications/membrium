import sys
import os

# Add backend dir to python path to allow imports
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from db.integration_helpers import get_integration
from integrations.cloudflare_r2 import apply_cors

def main():
    enabled, cfg = get_integration('cloudflare_r2')
    if not enabled:
        print("Cloudflare R2 is not enabled.")
        return
    
    account_id = cfg.get('account_id')
    access_key_id = cfg.get('access_key_id')
    secret_access_key = cfg.get('secret_access_key')
    bucket = cfg.get('bucket')
    
    if not all([account_id, access_key_id, secret_access_key, bucket]):
        print("Missing config for R2.")
        return
        
    ok, msg = apply_cors(account_id, access_key_id, secret_access_key, bucket)
    print(f"Success: {ok}, Message: {msg}")

if __name__ == "__main__":
    main()
