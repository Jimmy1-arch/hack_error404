import sys
import tkinter as tk
import json

def run_ui():
    root = tk.Tk()
    root.overrideredirect(True)
    root.attributes("-topmost", True)
    root.attributes("-alpha", 0.95)
    root.attributes("-transparentcolor", "#000001")
    root.configure(bg="#000001")
    
    ws = root.winfo_screenwidth()
    root.geometry(f"320x180+{ws - 340}+40")

    canvas = tk.Canvas(root, bg="#000001", highlightthickness=0)
    canvas.pack(fill="both", expand=True)

    def draw_rounded_rect(x1, y1, x2, y2, r, color):
        points = [
            x1+r, y1,   x2-r, y1,
            x2, y1,     x2, y1+r,
            x2, y2-r,   x2, y2,
            x2-r, y2,   x1+r, y2,
            x1, y2,     x1, y2-r,
            x1, y1+r,   x1, y1
        ]
        canvas.create_polygon(points, fill=color, smooth=True)

    draw_rounded_rect(0, 0, 320, 180, 20, '#1c1c1e')

    main_frame = tk.Frame(root, bg='#1c1c1e')
    main_frame.place(x=10, y=10, width=300, height=160)

    # Title
    title = tk.Label(main_frame, text="DevOps Copilot Agent", bg='#1c1c1e', fg='#ffffff', font=("Arial", 10, "bold"))
    title.pack(anchor='nw')

    status_label = tk.Label(main_frame, text="Starting...", bg='#1c1c1e', fg='#a3a3a3', font=("Arial", 9), wraplength=280, justify="left")
    status_label.pack(fill='x', pady=(5, 5))

    btn_frame = tk.Frame(main_frame, bg='#1c1c1e')
    btn_frame.pack(fill='x', side='bottom', pady=(0, 5))

    def send_cmd(cmd):
        print(cmd, flush=True)

    allow_btn = tk.Button(btn_frame, text="Allow", bg='#168452', fg='white', command=lambda: send_cmd("allow"), borderwidth=0, padx=10, pady=2)
    deny_btn = tk.Button(btn_frame, text="Deny", bg='#dc4937', fg='white', command=lambda: send_cmd("deny"), borderwidth=0, padx=10, pady=2)
    
    fixed_btn = tk.Button(btn_frame, text="Fixed", bg='#2563eb', fg='white', command=lambda: send_cmd("fixed"), borderwidth=0, padx=10, pady=2)
    not_fixed_btn = tk.Button(btn_frame, text="Not Fixed", bg='#dc4937', fg='white', command=lambda: send_cmd("not_fixed"), borderwidth=0, padx=10, pady=2)

    stop_btn = tk.Button(main_frame, text="Stop", bg='#444', fg='white', command=lambda: send_cmd("stop"), borderwidth=0, padx=10, pady=2)
    stop_btn.place(relx=1.0, rely=0.0, anchor='ne')

    # Draggable
    move_state = {"x": None, "y": None}
    def start_move(e): move_state["x"] = e.x; move_state["y"] = e.y
    def stop_move(e): move_state["x"] = None; move_state["y"] = None
    def do_move(e):
        if move_state["x"] is not None:
            x = root.winfo_x() + (e.x - move_state["x"])
            y = root.winfo_y() + (e.y - move_state["y"])
            root.geometry(f"+{x}+{y}")
            
    root.bind("<ButtonPress-1>", start_move)
    root.bind("<ButtonRelease-1>", stop_move)
    root.bind("<B1-Motion>", do_move)

    import queue
    import threading
    in_q = queue.Queue()
    
    def read_stdin():
        while True:
            line = sys.stdin.readline()
            if not line: break
            in_q.put(line.strip())

    threading.Thread(target=read_stdin, daemon=True).start()

    def process_queue():
        try:
            while True:
                msg = in_q.get_nowait()
                data = json.loads(msg)
                if data["type"] == "status":
                    status_label.config(text=data["text"])
                elif data["type"] == "permission":
                    fixed_btn.pack_forget()
                    not_fixed_btn.pack_forget()
                    allow_btn.pack(side='left', padx=5)
                    deny_btn.pack(side='left', padx=5)
                elif data["type"] == "hide_permission":
                    allow_btn.pack_forget()
                    deny_btn.pack_forget()
                elif data["type"] == "verification":
                    allow_btn.pack_forget()
                    deny_btn.pack_forget()
                    fixed_btn.pack(side='left', padx=5)
                    not_fixed_btn.pack(side='left', padx=5)
                elif data["type"] == "hide_verification":
                    fixed_btn.pack_forget()
                    not_fixed_btn.pack_forget()
                elif data["type"] == "stop":
                    root.destroy()
                    return
        except queue.Empty:
            pass
        except Exception:
            pass
        root.after(100, process_queue)

    process_queue()
    root.mainloop()

if __name__ == "__main__":
    run_ui()
