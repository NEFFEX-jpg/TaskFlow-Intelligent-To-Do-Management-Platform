"""
git-sync.py — 一键提交并推送，自动处理代理和网络问题
用法: python git-sync.py "提交信息"
      python git-sync.py              # 自动使用 "update" 作为提交信息
"""

import subprocess
import socket
import sys
import os
import time
import glob

# ============ 配置区 ============
PROXY_HOST = "127.0.0.1"
PROXY_PORT = 7897
MAX_RETRIES = 5
RETRY_INTERVAL = 10  # 秒

# Clash Verge 常见安装路径，脚本会逐个查找
CLASH_CANDIDATES = [
    r"C:\Users\32915\AppData\Local\Clash Verge\clash-verge.exe",
    r"C:\Users\32915\AppData\Local\Programs\Clash Verge\clash-verge.exe",
    r"C:\Program Files\Clash Verge\clash-verge.exe",
]
# 也尝试用 glob 搜索 Clash Verge 目录
CLASH_GLOB_PATTERNS = [
    r"C:\Users\32915\AppData\Local\*clash*\clash-verge.exe",
    r"C:\Users\32915\AppData\Local\Programs\*clash*\clash-verge.exe",
]
# ================================


def run(cmd, capture=True):
    """执行命令，返回 (returncode, stdout, stderr)"""
    r = subprocess.run(
        cmd, shell=True, capture_output=capture,
        text=True, encoding="utf-8", errors="replace"
    )
    return r.returncode, r.stdout.strip(), r.stderr.strip()


def info(msg):
    print(f"\033[36m[INFO]\033[0m {msg}")


def ok(msg):
    print(f"\033[32m[OK]\033[0m {msg}")


def warn(msg):
    print(f"\033[33m[WARN]\033[0m {msg}")


def fail(msg):
    print(f"\033[31m[FAIL]\033[0m {msg}")


def check_proxy():
    """检测代理端口是否在监听"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        result = s.connect_ex((PROXY_HOST, PROXY_PORT))
        s.close()
        return result == 0
    except Exception:
        return False


def find_clash():
    """查找 Clash Verge 可执行文件"""
    # 先查固定路径
    for p in CLASH_CANDIDATES:
        if os.path.isfile(p):
            return p
    # 再用 glob 搜索
    for pattern in CLASH_GLOB_PATTERNS:
        matches = glob.glob(pattern)
        if matches:
            return matches[0]
    return None


def start_clash():
    """尝试启动 Clash Verge"""
    clash_path = find_clash()
    if not clash_path:
        warn("未找到 Clash Verge，请手动启动你的代理软件")
        return False
    info(f"正在启动 Clash Verge: {clash_path}")
    try:
        subprocess.Popen([clash_path], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # 等待代理启动
        for i in range(15):
            time.sleep(1)
            if check_proxy():
                ok("Clash Verge 已启动，代理端口就绪")
                return True
        warn("Clash Verge 已启动但代理端口仍未就绪，请检查是否开启了系统代理")
        return False
    except Exception as e:
        warn(f"启动 Clash Verge 失败: {e}")
        return False


def check_github():
    """测试能否连通 GitHub"""
    info("测试 GitHub 连通性...")
    code, out, err = run("curl -s --connect-timeout 10 -o /dev/null -w '%{http_code}' https://github.com")
    if code == 0 and "200" in out:
        ok("GitHub 连通正常")
        return True
    # 再试 git ls-remote
    code, out, err = run("git ls-remote --heads")
    if code == 0:
        ok("GitHub 连通正常 (via git)")
        return True
    warn(f"GitHub 连接不稳定: {err[:100]}")
    return False


def git_status():
    """获取 git 状态"""
    code, out, err = run("git status --porcelain")
    return out


def git_add_all():
    """暂存所有变更"""
    info("暂存所有变更...")
    run("git add -A")


def git_commit(msg):
    """提交变更"""
    code, out, err = run(f'git commit -m "{msg}"')
    if code == 0:
        ok(f"提交成功: {msg}")
        return True
    elif "nothing to commit" in out or "nothing to commit" in err:
        info("没有新的变更需要提交")
        return None  # 无变更，不算失败
    else:
        fail(f"提交失败: {err or out}")
        return False


def git_push():
    """推送，自动 pull --rebase 并重试"""
    # 先拉取远程最新并 rebase，避免 non-fast-forward
    info("同步远程分支 (pull --rebase)...")
    code, out, err = run("git pull --rebase")
    if code != 0:
        warn(f"pull --rebase 失败: {err[:200]}")
        # 尝试 stash 后重试
        run("git stash")
        code2, _, _ = run("git pull --rebase")
        run("git stash pop")
        if code2 != 0:
            fail("无法同步远程分支，请手动解决冲突")
            return False

    for attempt in range(1, MAX_RETRIES + 1):
        info(f"推送中... (第 {attempt}/{MAX_RETRIES} 次)")
        code, out, err = run("git push")
        if code == 0:
            ok("推送成功!")
            print(out)
            return True
        fail_msg = err or out
        fail(f"推送失败: {fail_msg[:200]}")
        if attempt < MAX_RETRIES:
            info(f"等待 {RETRY_INTERVAL} 秒后重试...")
            time.sleep(RETRY_INTERVAL)
    fail(f"连续 {MAX_RETRIES} 次推送失败")
    return False


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("=" * 50)
    print("   Git 一键同步 — 自动处理代理 & 网络问题")
    print("=" * 50)

    # 1. 检查是否在 git 仓库
    code, _, _ = run("git rev-parse --is-inside-work-tree")
    if code != 0:
        fail("当前目录不是 git 仓库")
        sys.exit(1)

    # 2. 检查代理
    if check_proxy():
        ok(f"代理端口 {PROXY_HOST}:{PROXY_PORT} 正常")
    else:
        warn(f"代理端口 {PROXY_HOST}:{PROXY_PORT} 未响应")
        user_input = input("是否尝试启动 Clash Verge? (y/n): ").strip().lower()
        if user_input == "y":
            if not start_clash():
                warn("代理未就绪，将继续尝试推送（可能很慢或失败）")
        else:
            warn("跳过代理启动，将继续尝试推送")

    # 3. 测试 GitHub 连通性
    check_github()

    # 4. 检查变更
    status = git_status()
    if not status:
        ok("工作区干净，没有待提交的变更")
        # 检查是否有待推送的提交
        code, out, _ = run("git log @{u}.. --oneline 2>/dev/null")
        if code == 0 and out.strip():
            info("发现待推送的本地提交，开始推送...")
            if git_push():
                print("\n同步完成!")
                sys.exit(0)
            else:
                sys.exit(1)
        else:
            ok("一切已是最新，无需操作")
            sys.exit(0)

    print(f"\n检测到以下变更:\n{status}")

    # 5. 获取提交信息
    if len(sys.argv) > 1:
        commit_msg = " ".join(sys.argv[1:])
    else:
        commit_msg = input("\n请输入提交信息 (直接回车使用 'update'): ").strip()
        if not commit_msg:
            commit_msg = "update"

    # 6. 暂存 + 提交
    git_add_all()
    result = git_commit(commit_msg)
    if result is False:
        sys.exit(1)

    # 7. 推送
    if git_push():
        print("\n同步完成!")
    else:
        print("\n同步失败，请检查网络或手动推送: git push")
        sys.exit(1)


if __name__ == "__main__":
    main()
