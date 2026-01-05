#!/usr/bin/env python3
"""
Deploy frontend service after rate limit reset
"""

import json
import requests
import time

API_KEY = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
BASE_URL = 'https://api.render.com/v1'
OWNER_ID = 'tea-d5dui6uuk2gs7398e1ig'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Payload with proper serviceDetails
payload = {
    'ownerId': OWNER_ID,
    'name': 'tripavail-web',
    'type': 'web_service',
    'plan': 'free',
    'repo': 'https://github.com/tripavail92-byte/tripavailweb.git',
    'branch': 'main',
    'rootDir': 'web',
    'serviceDetails': {
        'numInstances': 1
    },
    'envVars': [
        {'key': 'NODE_ENV', 'value': 'production'},
        {'key': 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'value': 'AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ'}
    ]
}

print("Frontend Service Deployment\n")
print(json.dumps(payload, indent=2))
print("\nSending request...")

try:
    resp = requests.post(
        f'{BASE_URL}/services',
        headers=headers,
        json=payload,
        timeout=10
    )
    
    print(f"\nStatus Code: {resp.status_code}")
    
    if resp.status_code in [201, 200]:
        data = resp.json()
        print("\n✓ SUCCESS!")
        print(f"Service ID: {data.get('id')}")
        print(f"Name: {data.get('name')}")
        print(f"URL: {data.get('serviceDetails', {}).get('url', 'Will be assigned')}")
        
        # Save service ID
        with open('FRONTEND_SERVICE_ID.txt', 'w') as f:
            f.write(data['id'])
            
    else:
        print(f"\n✗ ERROR")
        try:
            error_data = resp.json()
            print(f"Message: {error_data.get('message', 'Unknown')}")
        except:
            print(f"Response: {resp.text[:300]}")
            
except requests.exceptions.Timeout:
    print("✗ REQUEST TIMEOUT - API might be rate limited")
except requests.exceptions.RequestException as e:
    print(f"✗ REQUEST FAILED: {e}")
except Exception as e:
    print(f"✗ ERROR: {e}")
