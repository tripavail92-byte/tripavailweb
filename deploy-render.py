#!/usr/bin/env python3
"""
Render.com API Deployment Script
Deploy frontend service and configure database
"""

import json
import requests
import sys

API_KEY = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
BASE_URL = 'https://api.render.com/v1'
OWNER_ID = 'tea-d5dui6uuk2gs7398e1ig'
REPO_URL = 'https://github.com/tripavail92-byte/tripavailweb.git'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

def create_service(name, root_dir, env_vars, build_cmd, start_cmd):
    """Create a web service on Render"""
    
    payload = {
        'ownerId': OWNER_ID,
        'name': name,
        'type': 'web_service',
        'plan': 'free',
        'runtime': 'node',
        'repo': REPO_URL,
        'branch': 'main',
        'rootDir': root_dir,
        'buildCommand': build_cmd,
        'startCommand': start_cmd,
        'envVars': [
            {'key': k, 'value': v} for k, v in env_vars.items()
        ]
    }
    
    print(f"\n{'='*60}")
    print(f"Creating {name}...")
    print(f"{'='*60}")
    print(f"Payload: {json.dumps(payload, indent=2)}\n")
    print("Sending request... (timeout 30s)")
    
    try:
        response = requests.post(
            f'{BASE_URL}/services',
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"✓ SUCCESS!")
            print(f"  Service ID: {data['id']}")
            print(f"  URL: {data.get('serviceDetails', {}).get('url', 'N/A')}")
            return data['id']
        else:
            print(f"✗ ERROR: HTTP {response.status_code}")
            try:
                err_data = response.json()
                print(f"  Message: {err_data.get('message', 'Unknown error')}")
                if 'details' in err_data:
                    print(f"  Details: {err_data['details']}")
            except:
                print(f"  Response: {response.text[:500]}")
            return None
    except Exception as e:
        print(f"✗ Exception: {str(e)}")
        return None

def get_services():
    """List all services"""
    try:
        response = requests.get(
            f'{BASE_URL}/services',
            headers=headers,
            timeout=30
        )
        if response.status_code == 200:
            data = response.json()
            return data.get('value', [])
        else:
            print(f"Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"Exception: {e}")
        return []

def main():
    print("TRIPAVAIL RENDER DEPLOYMENT\n")
    
    # List existing services
    print("Existing services:")
    services = get_services()
    for item in services:
        svc = item.get('service', {})
        print(f"  - {svc.get('name')} (ID: {svc.get('id')})")
    
    # Create frontend service
    frontend_id = create_service(
        name='tripavail-web',
        root_dir='web',
        env_vars={
            'NODE_ENV': 'production',
            'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': 'AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ'
        },
        build_cmd='npm ci && npm run build',
        start_cmd='npm start'
    )
    
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)
    print("1. Monitor service builds at: https://dashboard.render.com")
    print("2. Create PostgreSQL database in Render")
    print("3. Link database to backend service (tripavailweb)")
    print("4. Add DATABASE_URL env var to backend")
    print("5. Run migrations: npm run migration:run")
    print("6. Test: Visit frontend URL + /traveler/discovery")
    print("")

if __name__ == '__main__':
    main()
