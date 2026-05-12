import json
from unittest.mock import MagicMock, patch

from api_handler import GenericWebhook
from task_manager import TaskManager, is_resource_error
from settings_store import SettingsStore


def test_is_resource_error_detects_keywords() -> None:
    assert is_resource_error("Resource Error: SMS gateway timed out")
    assert is_resource_error("Please solve the captcha")
    assert is_resource_error("Enter OTP")
    assert not is_resource_error("Network timeout")


def test_generic_webhook_build_payload_substitution() -> None:
    gw = GenericWebhook("http://example.com")
    template = '{"message": "$message", "category": "$category"}'
    body = gw.build_payload(template, {"message": "hello", "category": "sms"})
    assert body == {"message": "hello", "category": "sms"}


def test_generic_webhook_send_from_template_posts_json() -> None:
    gw = GenericWebhook("https://httpbin.org/post", timeout_seconds=10.0)
    template = '{"ping": "$message"}'
    with patch("api_handler.requests.post") as post:
        post.return_value = MagicMock(status_code=200, content=b"{}", json=lambda: {})
        gw.send_from_template(template, {"message": "pong"})
    args, kwargs = post.call_args
    assert args[0] == "https://httpbin.org/post"
    assert kwargs["json"] == {"ping": "pong"}


def test_task_manager_injects_code_from_webhook_response(tmp_path) -> None:
    settings_path = tmp_path / "settings.json"
    settings_path.write_text(
        json.dumps(
            {
                "integration": {
                    "webhook_enabled": True,
                    "webhook_url": "https://hooks.example/test",
                    "webhook_payload_template": '{"message": "$message"}',
                    "webhook_timeout_seconds": 10,
                }
            }
        ),
        encoding="utf-8",
    )
    store = SettingsStore(settings_path)
    store.load()

    page = MagicMock()
    manager = TaskManager(store, page_provider=lambda: page)

    mock_response = MagicMock()
    mock_response.ok = True
    mock_response.content = b'{"code": "123456"}'
    mock_response.json.return_value = {"code": "123456"}

    with patch("task_manager.GenericWebhook.send_from_template", return_value=({"message": "x"}, mock_response)):
        manager.report_error("Resource Error: SMS verification required", task_id="t-1")

    assert page.keyboard.type.called


def test_task_manager_skips_when_disabled(tmp_path) -> None:
    settings_path = tmp_path / "settings.json"
    settings_path.write_text(json.dumps({"integration": {"webhook_enabled": False}}), encoding="utf-8")
    store = SettingsStore(settings_path)
    store.load()
    page = MagicMock()
    manager = TaskManager(store, page_provider=lambda: page)
    with patch("task_manager.GenericWebhook.send_from_template") as send:
        manager.report_error("Resource Error: captcha", task_id="t-2")
    send.assert_not_called()
