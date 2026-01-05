import json
import requests

API_KEY = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
BASE_URL = 'https://api.render.com/v1'
OWNER_ID = 'tea-d5dui6uuk2gs7398e1ig'

headers = {'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'}

# Try with different serviceDetails structure
payload = {
    'ownerId': OWNER_ID,
    'name': 'tripavail-web',
    'type': 'web_service',
    'repo': 'https://github.com/tripavail92-byte/tripavailweb.git',
    'branch': 'main',
    'rootDir': 'web',
    'buildCommand': 'npm ci && npm run build',
    'startCommand': 'npm start',
    'serviceDetails': {}
}

print(f"Payload: {json.dumps(payload, indent=2)}\n")

try:
    resp = requests.post(f'{BASE_URL}/services', headers=headers, json=payload, timeout=5)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 201:
        print("SUCCESS!")
        data = resp.json()
        print(f"Service ID: {data.get('id')}")
        print(f"URL: {data.get('serviceDetails', {}).get('url')}")
    else:
        print(f"Response: {resp.text}")
except requests.exceptions.Timeout:
    print("REQUEST TIMEOUT")
except Exception as e:
    print(f"ERROR: {e}")
