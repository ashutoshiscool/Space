import requests
import sys

BASE_URL = "http://localhost:3000"

def run_tests():
    print("=== STARTING LIVE API INTEGRATION & SECURITY AUDIT ===")
    
    # 1. Register Alice (Tenant 1)
    s_alice = requests.Session()
    res = s_alice.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Alice Tenant1",
        "email": "alice@tenant1.test",
        "password": "Password123!"
    })
    print(f"[AUTH] Alice Register: {res.status_code}")
    assert res.status_code == 200, f"Alice register failed: {res.text}"
    alice_data = res.json()["user"]
    print(f"       Alice ID: {alice_data['id']}")

    # 2. Register Bob (Tenant 2 - Unrelated attacker)
    s_bob = requests.Session()
    res = s_bob.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Bob Attacker",
        "email": "bob@attacker.test",
        "password": "Password123!"
    })
    print(f"[AUTH] Bob Register: {res.status_code}")
    assert res.status_code == 200, f"Bob register failed: {res.text}"
    bob_data = res.json()["user"]
    print(f"       Bob ID: {bob_data['id']}")

    # 3. Alice creates Workspace 1
    res = s_alice.post(f"{BASE_URL}/api/workspaces", json={
        "name": "Alice Corp",
        "slug": "alice-corp"
    })
    print(f"[TENANCY] Alice create workspace: {res.status_code}")
    assert res.status_code == 200, f"Alice create workspace failed: {res.text}"
    alice_ws = res.json()["workspace"]

    # 4. Bob creates Workspace 2
    res = s_bob.post(f"{BASE_URL}/api/workspaces", json={
        "name": "Bob Evil Corp",
        "slug": "bob-evil"
    })
    print(f"[TENANCY] Bob create workspace: {res.status_code}")
    assert res.status_code == 200, f"Bob create workspace failed: {res.text}"
    bob_ws = res.json()["workspace"]

    # 5. Alice creates a project in Workspace 1
    res = s_alice.post(f"{BASE_URL}/api/workspaces/alice-corp/projects", json={
        "name": "Project Alpha",
        "identifier": "ALP",
        "description": "Alice's proprietary secret project"
    })
    print(f"[PROJECT] Alice create project: {res.status_code}")
    assert res.status_code == 200, f"Alice create project failed: {res.text}"
    alice_proj = res.json()["project"]
    alice_proj_id = alice_proj["id"]

    # 6. Bob tries to access Alice's workspace (BOLA / IDOR test)
    res = s_bob.get(f"{BASE_URL}/api/workspaces/alice-corp")
    print(f"[SECURITY - IDOR] Bob GET Alice workspace: {res.status_code} (expect 403 or 404)")
    assert res.status_code in [403, 404], f"IDOR vulnerability! Bob accessed Alice's workspace: {res.text}"

    # 7. Bob tries to create an issue in Alice's project (IDOR test)
    res = s_bob.post(f"{BASE_URL}/api/projects/{alice_proj_id}/issues", json={
        "title": "Hacked Issue By Bob",
        "stateId": alice_proj["states"][0]["id"]
    })
    print(f"[SECURITY - IDOR] Bob create issue in Alice project: {res.status_code} (expect 403)")
    assert res.status_code == 403, f"IDOR vulnerability! Bob injected issue into Alice's project: {res.text}"

    # 8. Alice creates an issue in Project Alpha
    todo_state = [s for s in alice_proj["states"] if s["name"].lower() == "todo"][0]
    res = s_alice.post(f"{BASE_URL}/api/projects/{alice_proj_id}/issues", json={
        "title": "Alice Confidential Issue",
        "description": "Sensitive company data",
        "stateId": todo_state["id"],
        "priority": "HIGH"
    })
    print(f"[ISSUE] Alice create issue: {res.status_code}")
    assert res.status_code == 200, f"Alice issue creation failed: {res.text}"
    alice_issue = res.json()["issue"]
    alice_issue_id = alice_issue["id"]

    # 9. Bob tries to read Alice's issue directly by ID (IDOR test)
    res = s_bob.get(f"{BASE_URL}/api/issues/{alice_issue_id}")
    print(f"[SECURITY - IDOR] Bob read Alice issue: {res.status_code} (expect 403 or 404)")
    assert res.status_code in [403, 404], f"IDOR vulnerability! Bob read Alice's issue: {res.text}"

    # 10. Bob tries to update or delete Alice's issue
    res = s_bob.patch(f"{BASE_URL}/api/issues/{alice_issue_id}", json={
        "title": "Defaced by Bob"
    })
    print(f"[SECURITY - IDOR] Bob update Alice issue: {res.status_code} (expect 403)")
    assert res.status_code == 403, f"IDOR vulnerability! Bob modified Alice's issue: {res.text}"

    res = s_bob.delete(f"{BASE_URL}/api/issues/{alice_issue_id}")
    print(f"[SECURITY - IDOR] Bob delete Alice issue: {res.status_code} (expect 403)")
    assert res.status_code == 403, f"IDOR vulnerability! Bob deleted Alice's issue: {res.text}"

    # 11. Alice creates a Cycle in Project Alpha
    res = s_alice.post(f"{BASE_URL}/api/projects/{alice_proj_id}/cycles", json={
        "name": "Sprint 1",
        "startDate": "2026-10-01",
        "endDate": "2026-10-15"
    })
    print(f"[CYCLES] Alice create cycle: {res.status_code}")
    assert res.status_code == 200, f"Cycle create failed: {res.text}"
    alice_cycle = res.json()["cycle"]
    alice_cycle_id = alice_cycle["id"]

    # Assign Alice's issue to this cycle
    res = s_alice.patch(f"{BASE_URL}/api/issues/{alice_issue_id}", json={
        "cycleId": alice_cycle_id
    })
    assert res.status_code == 200

    # 12. Bob tries to complete Alice's cycle (IDOR test)
    res = s_bob.patch(f"{BASE_URL}/api/cycles/{alice_cycle_id}/complete", json={
        "rolloverToCycleId": None
    })
    print(f"[SECURITY - IDOR] Bob complete Alice cycle: {res.status_code} (expect 403)")
    assert res.status_code == 403, f"IDOR vulnerability! Bob completed Alice's cycle: {res.text}"

    # 13. Alice completes Cycle 1 and rolls over incomplete issue to backlog
    res = s_alice.patch(f"{BASE_URL}/api/cycles/{alice_cycle_id}/complete", json={
        "rolloverToCycleId": None
    })
    print(f"[CYCLES] Alice complete cycle: {res.status_code}")
    assert res.status_code == 200
    cycle_res = res.json()
    assert cycle_res["completedCycleId"] == alice_cycle_id
    assert cycle_res["rolledOverCount"] == 1
    print(f"        Rolled over: {cycle_res['rolledOverCount']} issue(s)")

    # Verify issue cycleId is now null (backlog)
    res = s_alice.get(f"{BASE_URL}/api/issues/{alice_issue_id}")
    assert res.json()["issue"]["cycleId"] is None
    print("        Verified issue returned to backlog!")

    # 14. INVITATION FLOW: Alice invites Charlie as MEMBER
    res = s_alice.post(f"{BASE_URL}/api/workspaces/alice-corp/invitations", json={
        "email": "charlie@team.test",
        "role": "MEMBER"
    })
    print(f"[INVITE] Alice create invite: {res.status_code}")
    assert res.status_code == 200
    invite_url = res.json()["inviteUrl"]
    invite_token = res.json()["invite"]["token"]
    print(f"        Invite URL: {invite_url}")

    # Inspect invite without auth
    res = requests.get(f"{BASE_URL}/api/invitations?token={invite_token}")
    print(f"[INVITE] Public inspect invite: {res.status_code}")
    assert res.status_code == 200
    assert res.json()["invite"]["workspace"]["name"] == "Alice Corp"

    # Register Charlie and accept invitation
    s_charlie = requests.Session()
    res = s_charlie.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Charlie Member",
        "email": "charlie@team.test",
        "password": "Password123!"
    })
    assert res.status_code == 200

    res = s_charlie.post(f"{BASE_URL}/api/invitations/accept", json={
        "token": invite_token
    })
    print(f"[INVITE] Charlie accept invite: {res.status_code}")
    assert res.status_code == 200
    assert res.json()["workspaceSlug"] == "alice-corp"

    # Verify token is now consumed (single-use)
    res = s_charlie.post(f"{BASE_URL}/api/invitations/accept", json={
        "token": invite_token
    })
    print(f"[INVITE] Replay consumed token: {res.status_code} (expect 404)")
    assert res.status_code == 404, "Security failure: token was reused!"

    # Charlie (now a MEMBER) can read Alice Corp and Alice's issue
    res = s_charlie.get(f"{BASE_URL}/api/issues/{alice_issue_id}")
    print(f"[RBAC] Charlie (MEMBER) read issue: {res.status_code}")
    assert res.status_code == 200

    # Charlie adds a comment
    res = s_charlie.post(f"{BASE_URL}/api/issues/{alice_issue_id}/comments", json={
        "content": "I am working on this now!"
    })
    print(f"[COMMENTS] Charlie post comment: {res.status_code}")
    assert res.status_code == 200
    assert res.json()["comment"]["content"] == "I am working on this now!"

    # 15. FILE UPLOAD & ATTACHMENTS
    # Malicious upload attempt (.sh script)
    files_malicious = {
        'file': ('malware.sh', b'#!/bin/bash\necho pwned', 'application/x-sh')
    }
    res = s_alice.post(f"{BASE_URL}/api/upload", files=files_malicious)
    print(f"[SECURITY - UPLOAD] Upload malicious script: {res.status_code} (expect 400)")
    assert res.status_code == 400, "Security failure: executable script upload allowed!"

    # Valid upload (screenshot.png)
    files_valid = {
        'file': ('screenshot.png', b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRtest', 'image/png')
    }
    res = s_alice.post(f"{BASE_URL}/api/upload", files=files_valid)
    print(f"[UPLOAD] Upload valid image: {res.status_code}")
    assert res.status_code == 200
    upload_data = res.json()
    file_url = upload_data["url"]
    print(f"         Uploaded to: {file_url}")

    # Attach file to issue
    res = s_alice.post(f"{BASE_URL}/api/issues/{alice_issue_id}/attachments", json={
        "fileName": "screenshot.png",
        "fileUrl": file_url,
        "fileSize": upload_data["fileSize"],
        "mimeType": "image/png"
    })
    print(f"[ATTACHMENTS] Attach file to issue: {res.status_code}")
    assert res.status_code == 200

    # Fetch attachments
    res = s_charlie.get(f"{BASE_URL}/api/issues/{alice_issue_id}/attachments")
    print(f"[ATTACHMENTS] Fetch attachments: {res.status_code}")
    assert res.status_code == 200
    assert len(res.json()["attachments"]) == 1
    assert res.json()["attachments"][0]["fileName"] == "screenshot.png"

    # 16. PAGES & PUBLIC SHARING
    # Alice creates a private page
    res = s_alice.post(f"{BASE_URL}/api/projects/{alice_proj_id}/pages", json={
        "title": "Private Architecture Doc",
        "content": "<p>Internal secret system design</p>",
        "isPublic": False
    })
    print(f"[PAGES] Alice create private page: {res.status_code}")
    assert res.status_code == 200
    private_page_id = res.json()["page"]["id"]

    # Bob tries to read Alice's private page
    res = s_bob.get(f"{BASE_URL}/api/pages/{private_page_id}")
    print(f"[SECURITY - PAGES] Bob read private page: {res.status_code} (expect 403 or 404)")
    assert res.status_code in [403, 404]

    # Unauthenticated user tries to read private page
    res = requests.get(f"{BASE_URL}/api/pages/{private_page_id}")
    print(f"[SECURITY - PAGES] Anonymous read private page: {res.status_code} (expect 401)")
    assert res.status_code == 401

    # Alice makes page public
    res = s_alice.patch(f"{BASE_URL}/api/pages/{private_page_id}", json={
        "isPublic": True
    })
    assert res.status_code == 200

    # Now unauthenticated user CAN read public page
    res = requests.get(f"{BASE_URL}/api/pages/{private_page_id}")
    print(f"[PAGES] Anonymous read public page: {res.status_code}")
    assert res.status_code == 200
    assert res.json()["page"]["title"] == "Private Architecture Doc"

    print("\n>>> ALL LIVE API SECURITY & FUNCTIONAL CHECKS PASSED! <<<")

if __name__ == "__main__":
    run_tests()
