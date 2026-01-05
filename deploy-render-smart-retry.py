#!/usr/bin/env python3
"""
Render.com API Deployment with Exponential Backoff
- Respects Ratelimit-Reset header
- Implements exponential backoff + jitter
- Proper error handling and retry logic
"""

import json
import requests
import time
import random
from typing import Optional, Dict, Any

API_KEY = 'rnd_zISgWLGpFVVWNLs7p8ICjZe5EIFy'
BASE_URL = 'https://api.render.com/v1'
OWNER_ID = 'tea-d5dui6uuk2gs7398e1ig'
REPO_URL = 'https://github.com/tripavail92-byte/tripavailweb.git'

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

class RenderAPI:
    def __init__(self, api_key: str, owner_id: str):
        self.api_key = api_key
        self.owner_id = owner_id
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        self.max_retries = 5
        self.base_wait = 1  # Start with 1 second
        
    def _get_backoff_time(self, retry_count: int, ratelimit_reset: Optional[int] = None) -> float:
        """
        Calculate backoff time using exponential backoff + jitter
        If Ratelimit-Reset header is present, use that as the minimum wait
        """
        if ratelimit_reset:
            # Use Ratelimit-Reset header value
            now = time.time()
            reset_wait = max(0, ratelimit_reset - now)
            print(f"  Rate limit resets in {reset_wait:.1f} seconds (from header)")
            return reset_wait + random.uniform(0, 1)  # Add jitter
        
        # Exponential backoff: 2^retry * base + jitter
        wait_time = (2 ** retry_count) * self.base_wait
        jitter = random.uniform(0, wait_time * 0.1)  # 10% jitter
        total_wait = wait_time + jitter
        return total_wait
    
    def _make_request(self, method: str, endpoint: str, payload: Dict[str, Any]) -> Optional[Dict]:
        """Make API request with exponential backoff retry logic"""
        url = f'{BASE_URL}{endpoint}'
        
        for retry_count in range(self.max_retries):
            try:
                print(f"\n[Attempt {retry_count + 1}/{self.max_retries}] {method} {endpoint}")
                
                response = requests.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    json=payload,
                    timeout=10
                )
                
                # Success responses
                if response.status_code in [200, 201]:
                    print(f"✓ SUCCESS (HTTP {response.status_code})")
                    return response.json()
                
                # Rate limited - use exponential backoff
                if response.status_code == 429:
                    ratelimit_reset = response.headers.get('Ratelimit-Reset')
                    if ratelimit_reset:
                        try:
                            ratelimit_reset = int(ratelimit_reset)
                        except ValueError:
                            ratelimit_reset = None
                    
                    wait_time = self._get_backoff_time(retry_count, ratelimit_reset)
                    print(f"⚠ Rate limited (429)")
                    print(f"  Waiting {wait_time:.1f}s before retry...")
                    time.sleep(wait_time)
                    continue
                
                # Other errors
                if response.status_code >= 400:
                    try:
                        error_data = response.json()
                        print(f"✗ ERROR (HTTP {response.status_code})")
                        print(f"  Message: {error_data.get('message', 'Unknown error')}")
                    except:
                        print(f"✗ ERROR (HTTP {response.status_code})")
                        print(f"  Response: {response.text[:200]}")
                    return None
                
            except requests.exceptions.Timeout:
                print(f"✗ Timeout (attempt {retry_count + 1}/{self.max_retries})")
                if retry_count < self.max_retries - 1:
                    wait_time = self._get_backoff_time(retry_count)
                    print(f"  Waiting {wait_time:.1f}s...")
                    time.sleep(wait_time)
                continue
                
            except Exception as e:
                print(f"✗ Exception: {e}")
                return None
        
        print(f"✗ Failed after {self.max_retries} attempts")
        return None
    
    def create_service(self, name: str, root_dir: str, env_vars: Dict[str, str], 
                      build_cmd: str, start_cmd: str) -> Optional[str]:
        """Create a web service"""
        
        payload = {
            'ownerId': self.owner_id,
            'name': name,
            'type': 'web_service',
            'plan': 'free',
            'runtime': 'node',
            'repo': REPO_URL,
            'branch': 'main',
            'rootDir': root_dir,
            'serviceDetails': {
                'envSpecificDetails': {
                    'nodeEnvSpecificDetails': {
                        'buildCommand': build_cmd,
                        'startCommand': start_cmd
                    }
                }
            },
            'envVars': [
                {'key': k, 'value': v} for k, v in env_vars.items()
            ]
        }
        
        print(f"\n{'='*60}")
        print(f"Creating Service: {name}")
        print(f"{'='*60}")
        print(f"Root Directory: {root_dir}")
        print(f"Environment Variables: {len(payload['envVars'])}")
        
        result = self._make_request('POST', '/services', payload)
        
        if result:
            service_id = result.get('id')
            print(f"✓ Service created: {service_id}")
            return service_id
        else:
            print(f"✗ Failed to create {name}")
            return None
    
    def get_services(self):
        """List all services"""
        result = self._make_request('GET', '/services', {})
        if result:
            return result.get('value', [])
        return []

def main():
    print("TripAvail Render Deployment - REST API with Smart Retry\n")
    
    api = RenderAPI(API_KEY, OWNER_ID)
    
    # List existing services
    print("Fetching existing services...")
    services = api.get_services()
    if services:
        print(f"Found {len(services)} existing service(s):")
        for item in services:
            svc = item.get('service', {})
            print(f"  - {svc.get('name')} ({svc.get('id')})")
    else:
        print("No existing services found")
    
    # Deploy frontend service
    frontend_id = api.create_service(
        name='tripavail-web',
        root_dir='web',
        env_vars={
            'NODE_ENV': 'production',
            'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': 'AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ',
            'NEXT_PUBLIC_API_BASE_URL': 'https://tripavail-backend.onrender.com/v1'
        },
        build_cmd='npm ci && npm run build',
        start_cmd='npm start'
    )
    
    print("\n" + "="*60)
    print("DEPLOYMENT SUMMARY")
    print("="*60)
    
    if frontend_id:
        print(f"✓ Frontend Service: {frontend_id}")
        print(f"  URL: https://tripavail-web.onrender.com")
    else:
        print("✗ Frontend deployment failed")
    
    print("\nNext Steps:")
    print("1. Monitor builds: https://dashboard.render.com")
    print("2. Once services go Live, run migrations via Shell")
    print("3. Test: https://tripavail-web.onrender.com/traveler/discovery")

if __name__ == '__main__':
    main()
