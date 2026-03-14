def test_repository_tree_hides_ignored_directories(client, tmp_path):
    repository_dir = tmp_path / "sample-repo"
    (repository_dir / "src").mkdir(parents=True)
    (repository_dir / "node_modules").mkdir()
    (repository_dir / "src" / "main.py").write_text("print('hello')\n", encoding="utf-8")
    (repository_dir / "node_modules" / "ignored.js").write_text("console.log('ignore');\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]

    tree_response = client.get(f"/api/repositories/{repo_id}/tree", params={"depth": 2})
    assert tree_response.status_code == 200

    nodes = tree_response.json()["nodes"]
    names = [node["name"] for node in nodes]
    assert "src" in names
    assert "node_modules" not in names


def test_indexing_creates_chunks_and_status(client, tmp_path):
    repository_dir = tmp_path / "indexable-repo"
    (repository_dir / "src").mkdir(parents=True)
    long_python_file = "\n".join(f"line_{index} = {index}" for index in range(100))
    (repository_dir / "src" / "main.py").write_text(long_python_file, encoding="utf-8")
    (repository_dir / "README.md").write_text("# Demo\n\nRepository overview.\n", encoding="utf-8")
    (repository_dir / "binary.dat").write_bytes(b"\x00\x01\x02binary")
    (repository_dir / "dist").mkdir()
    (repository_dir / "dist" / "bundle.js").write_text("console.log('skip');\n", encoding="utf-8")

    create_response = client.post(
        "/api/repositories",
        json={"source_type": "local", "root_path": str(repository_dir)},
    )
    repo_id = create_response.json()["id"]

    index_response = client.post(f"/api/repositories/{repo_id}/index")
    assert index_response.status_code == 200

    indexed = index_response.json()
    assert indexed["status"] == "ready"
    assert indexed["file_count"] == 2
    assert indexed["chunk_count"] == 3
    assert indexed["skipped_file_count"] == 1

    status_response = client.get(f"/api/repositories/{repo_id}/index-status")
    assert status_response.status_code == 200
    status_payload = status_response.json()
    assert status_payload["status"] == "ready"
    assert status_payload["primary_language"] == "python"
    assert status_payload["file_count"] == 2
    assert status_payload["chunk_count"] == 3

    chunks_response = client.get(f"/api/repositories/{repo_id}/chunks", params={"limit": 10})
    assert chunks_response.status_code == 200
    chunks = chunks_response.json()["items"]
    assert len(chunks) == 3
    assert all("dist/" not in chunk["path"] for chunk in chunks)
