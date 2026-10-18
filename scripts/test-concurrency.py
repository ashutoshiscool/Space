import requests
import concurrent.futures

BASE_URL = "http://localhost:3000"

def test_concurrent_issue_creation():
    print("=== TESTING CONCURRENT ISSUE CREATION IDENTIFIER UNIQUENESS ===")
    s = requests.Session()
    res = s.post(f"{BASE_URL}/api/auth/login", json={
        "email": "alice@tenant1.test",
        "password": "Password123!"
    })
    assert res.status_code == 200
    
    # Get Alice's workspace and project
    res = s.get(f"{BASE_URL}/api/workspaces/alice-corp")
    assert res.status_code == 200
    ws = res.json()["workspace"]
    project = ws["projects"][0]
    proj_id = project["id"]

    res = s.get(f"{BASE_URL}/api/projects/{proj_id}/states")
    assert res.status_code == 200
    states = res.json()["states"]
    todo_state = states[0]["id"]

    cookies = s.cookies.get_dict()

    def create_issue(idx):
        cs = requests.Session()
        for k, v in cookies.items():
            cs.cookies.set(k, v)
        r = cs.post(f"{BASE_URL}/api/projects/{proj_id}/issues", json={
            "title": f"Concurrent Issue {idx}",
            "stateId": todo_state,
            "priority": "MEDIUM"
        })
        return r.json()

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(create_issue, i) for i in range(1, 11)]
        results = [f.result() for f in futures]

    sequence_ids = [r["issue"]["sequenceId"] for r in results]
    print(f"Generated sequence IDs: {sorted(sequence_ids)}")

    # Verify no duplicates
    assert len(sequence_ids) == len(set(sequence_ids)), f"Duplicate sequence IDs found! {sequence_ids}"
    print(">>> CONCURRENT ISSUE CREATION: ZERO DUPLICATES! ALL IDENTIFIERS UNIQUE! <<<")

if __name__ == "__main__":
    test_concurrent_issue_creation()
