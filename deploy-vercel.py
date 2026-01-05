#!/usr/bin/env python3
"""
Deploy TripAvail frontend to Vercel using API
Frontend: Next.js on Vercel (fast, zero config)
Backend: NestJS on Render (already running)
Database: PostgreSQL on Render (manual setup)
"""

import requests
import json
import time

VERCEL_API_KEY = 'Cg9gfOnLoQbZE6fE6uHxRT5v'
VERCEL_API_URL = 'https://api.vercel.com'

GITHUB_REPO = 'tripavail92-byte/tripavailweb'
GITHUB_BRANCH = 'main'

headers = {
    'Authorization': f'Bearer {VERCEL_API_KEY}',
    'Content-Type': 'application/json'
}

def deploy_to_vercel():
    """Deploy frontend to Vercel"""
    
    payload = {
        'name': 'tripavail-web',
        'gitRepository': {
            'repo': GITHUB_REPO,
            'type': 'github'
        },
        'rootDirectory': 'web',
        'framework': 'nextjs',
        'buildCommand': 'npm ci && npm run build',
        'outputDirectory': '.next',
        'env': [
            {
                'key': 'NODE_ENV',
                'value': 'production'
            },
            {
                'key': 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
                'value': 'AIzaSyCTtD2Sl83BYbyDvc_0MU29UxaGc8gQmmQ'
            },
            {
                'key': 'NEXT_PUBLIC_API_BASE_URL',
                'value': 'https://tripavailweb.onrender.com/v1'
            }
        ]
    }
    
    print("=" * 70)
    print("DEPLOYING TRIPAVAIL FRONTEND TO VERCEL")
    print("=" * 70)
    print(f"\nProject: tripavail-web")
    print(f"Repository: {GITHUB_REPO}")
    print(f"Branch: {GITHUB_BRANCH}")
    print(f"Root Directory: web")
    print(f"Framework: Next.js")
    print(f"Environment Variables: 3")
    print()
    
    try:
        print("Sending deployment request to Vercel...")
        response = requests.post(
            f'{VERCEL_API_URL}/v12/deployments',
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            deployment_id = data.get('id')
            project_id = data.get('projectId')
            url = data.get('url')
            
            print("\n✓ DEPLOYMENT CREATED!")
            print(f"  Deployment ID: {deployment_id}")
            print(f"  Project ID: {project_id}")
            print(f"  URL: https://{url}")
            print()
            
            # Wait and check status
            print("Monitoring deployment status...")
            check_deployment_status(deployment_id)
            
            return {
                'deployment_id': deployment_id,
                'project_id': project_id,
                'url': url
            }
        else:
            print(f"\n✗ DEPLOYMENT FAILED")
            print(f"  Status Code: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  Error: {error_data.get('error', {}).get('message', 'Unknown error')}")
            except:
                print(f"  Response: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("\n✗ REQUEST TIMEOUT")
        return None
    except Exception as e:
        print(f"\n✗ EXCEPTION: {e}")
        return None

def check_deployment_status(deployment_id, max_checks=30):
    """Check deployment status periodically"""
    
    for check_num in range(max_checks):
        try:
            response = requests.get(
                f'{VERCEL_API_URL}/v12/deployments/{deployment_id}',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                state = data.get('state')
                url = data.get('url')
                
                if state == 'READY':
                    print(f"  ✓ Deployment READY!")
                    print(f"    URL: https://{url}")
                    return True
                elif state == 'ERROR':
                    print(f"  ✗ Deployment ERROR")
                    error = data.get('errorMessage', 'Unknown error')
                    print(f"    Error: {error}")
                    return False
                elif state in ['BUILDING', 'QUEUED', 'INITIALIZING']:
                    elapsed = check_num * 5
                    print(f"  [{elapsed}s] State: {state}")
                else:
                    print(f"  State: {state}")
                
                time.sleep(5)
            else:
                print(f"  Could not fetch status (HTTP {response.status_code})")
                time.sleep(5)
                
        except Exception as e:
            print(f"  Status check failed: {e}")
            time.sleep(5)
    
    print("  Deployment status check timed out (still building)")
    print("  Check Vercel dashboard for progress: https://vercel.com")
    return None

def main():
    result = deploy_to_vercel()
    
    print("\n" + "=" * 70)
    print("NEXT STEPS")
    print("=" * 70)
    
    if result:
        url = result['url']
        print(f"\n1. Frontend URL: https://{url}")
        print(f"   Discovery page: https://{url}/traveler/discovery")
        print(f"\n2. Backend URL: https://tripavailweb.onrender.com")
        print(f"   Health check: https://tripavailweb.onrender.com/v1/health")
        print(f"\n3. Database Setup (Manual):")
        print(f"   - Go to: https://dashboard.render.com")
        print(f"   - Click: New → PostgreSQL")
        print(f"   - Name: tripavail-postgres")
        print(f"   - Database: tripavail")
        print(f"   - Copy the External Database URL")
        print(f"\n4. Link Database to Backend:")
        print(f"   - Open tripavailweb service → Environment")
        print(f"   - Add DATABASE_URL = <paste database URL>")
        print(f"   - Service auto-redeploys")
        print(f"\n5. Run Migrations:")
        print(f"   - Open tripavailweb → Shell")
        print(f"   - Run: npm run migration:run")
        print(f"\n6. Test:")
        print(f"   - Visit: https://{url}/traveler/discovery")
    else:
        print("\n✗ Deployment failed. Check the error above.")
        print("   Try again or check Vercel dashboard: https://vercel.com")
    
    print("\n" + "=" * 70)

if __name__ == '__main__':
    main()
