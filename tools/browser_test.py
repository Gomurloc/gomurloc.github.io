"""Run browser test suites in headless Edge or Chrome.

python tools/browser_test.py ui intro run      (dev server must be running on :8080)

Each suite page posts its results to the dev server, which writes
.cache/results/<suite>.txt; exit code is 0 only if every suite passed.
"""
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / ".cache" / "results"
BROWSERS = [
    Path("C:/Program Files/Google/Chrome/Application/chrome.exe"),
    Path("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"),
    Path("C:/Program Files/Microsoft/Edge/Application/msedge.exe"),
]


def run_suite(browser, suite, port, timeout):
    out = RESULTS / f"{suite}.txt"
    out.unlink(missing_ok=True)
    profile = Path(tempfile.mkdtemp(prefix="kostudio-headless-"))
    proc = subprocess.Popen([
        str(browser), "--headless=new", f"--user-data-dir={profile}", "--no-first-run",
        "--no-default-browser-check", "--window-size=1280,900", "--enable-unsafe-swiftshader",
        "--autoplay-policy=user-gesture-required",
        # Keep the page "visible" even when the desktop is locked or covered (remote sessions).
        "--disable-features=CalculateNativeWinOcclusion", "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
        f"http://127.0.0.1:{port}/__tests__/{suite}.html?report",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        end = time.time() + timeout
        while time.time() < end and not out.exists():
            time.sleep(0.5)
    finally:
        # Kill the whole tree: renderer and GPU children otherwise outlive the browser and keep running.
        subprocess.run(["taskkill", "/T", "/F", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        proc.wait()
        # Some helpers (crashpad, utility) are not in the tree; find them by this run's unique profile path.
        ps = ("Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' or Name='chrome.exe'\" | "
              f"Where-Object {{ $_.CommandLine -like '*{profile.name}*' }} | "
              "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }")
        subprocess.run(["powershell", "-NoProfile", "-Command", ps], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(1)
        shutil.rmtree(profile, ignore_errors=True)
    if not out.exists():
        return False, f"{suite}: no result within {timeout}s"
    text = out.read_text(encoding="utf-8")
    return "RESULT: PASS" in text, text.strip()


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    timeout = int(next((a.split("=")[1] for a in sys.argv[1:] if a.startswith("--timeout=")), 180))
    browser = next((b for b in BROWSERS if b.exists()), None)
    if not browser:
        sys.exit("no Edge or Chrome found")
    ok_all = True
    for suite in args:
        ok, text = run_suite(browser, suite, 8080, timeout)
        ok_all &= ok
        print(f"== {suite}\n{text}\n", flush=True)
    sys.exit(0 if ok_all else 1)


if __name__ == "__main__":
    main()
