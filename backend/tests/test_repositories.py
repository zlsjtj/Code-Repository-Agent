def test_create_and_list_local_repository(client, tmp_path):
    repository_dir = tmp_path / "sample-repo"
    repository_dir.mkdir()

    create_response = client.post(
        "/api/repositories",
        json={
            "source_type": "local",
            "root_path": str(repository_dir),
        },
    )
    assert create_response.status_code == 201

    created = create_response.json()
    assert created["name"] == "sample-repo"
    assert created["status"] == "pending"

    list_response = client.get("/api/repositories")
    assert list_response.status_code == 200
    items = list_response.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == created["id"]

