#!/usr/bin/env python3
"""Small Linear GraphQL helper used by /team."""
import json
import os
import sys
import urllib.request

API = "https://api.linear.app/graphql"
TOKEN = os.environ.get("LINEAR_TOKEN", "")

if not TOKEN:
    raise SystemExit("lin.py: LINEAR_TOKEN is required")


def gql(query, variables=None):
    request = urllib.request.Request(
        API,
        data=json.dumps({"query": query, "variables": variables or {}}).encode(),
        headers={"Content-Type": "application/json", "Authorization": TOKEN},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.load(response)
    except Exception as error:
        raise SystemExit(f"lin.py: Linear request failed: {error}") from error
    if result.get("errors"):
        raise SystemExit(f"lin.py: Linear error: {result['errors']}")
    return result["data"]


def arg(index, label):
    if len(sys.argv) <= index or not sys.argv[index]:
        raise SystemExit(f"lin.py: missing {label}")
    return sys.argv[index]


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "help"
    if command == "teams":
        for item in gql("{ teams { nodes { id name key } } }")["teams"]["nodes"]:
            print(item["id"], item["key"], item["name"])
        return
    if command in {"states", "projects"}:
        team_id = arg(2, "team-id")
        field = "states" if command == "states" else "projects"
        query = f"query($id: String!) {{ team(id: $id) {{ {field} {{ nodes {{ id name }} }} }} }}"
        for item in gql(query, {"id": team_id})["team"][field]["nodes"]:
            print(item["id"], item["name"])
        return
    if command == "mkproject":
        team_id, name = arg(2, "team-id"), arg(3, "project-name")
        data = gql(
            "mutation($input: ProjectCreateInput!) { projectCreate(input: $input) { project { id name } } }",
            {"input": {"teamIds": [team_id], "name": name}},
        )["projectCreate"]["project"]
        print(data["id"], data["name"])
        return
    if command == "create":
        team_id, title = arg(2, "team-id"), arg(3, "title")
        description = sys.argv[4] if len(sys.argv) > 4 else ""
        project_id = sys.argv[5] if len(sys.argv) > 5 else None
        input_data = {"teamId": team_id, "title": title, "description": description}
        if project_id:
            input_data["projectId"] = project_id
        data = gql(
            "mutation($input: IssueCreateInput!) { issueCreate(input: $input) { issue { id identifier url } } }",
            {"input": input_data},
        )["issueCreate"]["issue"]
        print(data["id"], data["identifier"], data["url"])
        return
    if command == "state":
        issue_id, state = arg(2, "issue-id"), arg(3, "state")
        if len(sys.argv) > 4:
            team_id = sys.argv[4]
            states = gql(
                "query($id: String!) { team(id: $id) { states { nodes { id name } } } }",
                {"id": team_id},
            )["team"]["states"]["nodes"]
            match = next((item for item in states if item["name"].lower() == state.lower()), None)
            if not match:
                raise SystemExit(f"lin.py: state not found: {state}")
            state = match["id"]
        data = gql(
            "mutation($id: String!, $state: String!) { issueUpdate(id: $id, input: { stateId: $state }) { issue { identifier state { name } } } }",
            {"id": issue_id, "state": state},
        )["issueUpdate"]["issue"]
        print(data["identifier"], "->", data["state"]["name"])
        return
    if command == "comment":
        issue_id = arg(2, "issue-id")
        body = sys.stdin.read() if len(sys.argv) > 3 and sys.argv[3] == "-" else arg(3, "comment")
        result = gql(
            "mutation($input: CommentCreateInput!) { commentCreate(input: $input) { success } }",
            {"input": {"issueId": issue_id, "body": body}},
        )["commentCreate"]
        print("comment:", result["success"])
        return
    raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
