import tkinter as tk
from tkinter import messagebox
from PIL import Image, ImageTk
import random
import os
import time

# ================================
# CONFIGURATION — edit freely
# ================================
NUM_PAIRS       = 5
ROWS            = 2
COLS            = 5
IMAGES_DIR      = "images"
PADDING         = 40
FLIP_DELAY      = 800   # ms before non-match cards flip back

VICTORY_TITLE   = "כל הכבוד!"
VICTORY_MESSAGE = "happy birthday shachar i love you\n\nסיימת ב-{steps} צעדים ו-{time}!"

valid_extensions = (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".jfif")


# ================================
# GameBoard class
# ================================
class GameBoard:
    def __init__(self, root: tk.Tk):
        self.root = root
        self._images = []
        self._back_image = None
        self._buttons = []
        self._cards = []
        self._revealed = []
        self._matched = []
        self._first = None
        self._second = None
        self._lock = False
        self._attempts = 0
        self._start_time = 0.0
        self._timer_id = None

        self._load_images()
        self._build_ui()
        self._new_game()

    def _load_images(self):
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        card_w = (screen_w - PADDING * (COLS + 1)) // COLS
        card_h = (screen_h - PADDING * (ROWS + 1)) // ROWS
        self._card_size = (card_w, card_h)

        files = [
            f for f in os.listdir(IMAGES_DIR)
            if f.lower().endswith(valid_extensions) and f.lower() != "back.png"
        ]
        if len(files) < NUM_PAIRS:
            raise ValueError(f"צריך לפחות {NUM_PAIRS} תמונות בתיקייה!")
        files = files[:NUM_PAIRS]

        self._images = []
        for file in files:
            path = os.path.join(IMAGES_DIR, file)
            img = Image.open(path).resize(self._card_size)
            self._images.append(ImageTk.PhotoImage(img))

        back_path = os.path.join(IMAGES_DIR, "back.png")
        if os.path.exists(back_path):
            back_raw = Image.open(back_path).resize(self._card_size)
        else:
            back_raw = Image.new("RGB", self._card_size, color="gray")
        self._back_image = ImageTk.PhotoImage(back_raw)

    def _build_ui(self):
        self.root.configure(bg="#222")

        # HUD row
        hud = tk.Frame(self.root, bg="#222")
        hud.pack(pady=(10, 0))

        self._attempts_label = tk.Label(
            hud, text="ניסיונות: 0",
            font=("Arial", 22), bg="#222", fg="white"
        )
        self._attempts_label.pack(side="left", padx=40)

        self._timer_label = tk.Label(
            hud, text="זמן: 00:00",
            font=("Arial", 22), bg="#222", fg="white"
        )
        self._timer_label.pack(side="left", padx=40)

        # Card board
        self._board_frame = tk.Frame(self.root, bg="#333")
        self._board_frame.pack(expand=True)

        for r in range(ROWS):
            self._board_frame.grid_rowconfigure(r, weight=1)
        for c in range(COLS):
            self._board_frame.grid_columnconfigure(c, weight=1)

        # Play Again button (hidden until win)
        self._play_again_btn = tk.Button(
            self.root, text="שחק שוב",
            font=("Arial", 24), bg="#444", fg="white",
            command=self._new_game
        )

    def _new_game(self):
        # Cancel running timer
        if self._timer_id is not None:
            self.root.after_cancel(self._timer_id)
            self._timer_id = None

        # Destroy old buttons
        for btn in self._buttons:
            btn.destroy()

        # Shuffle cards
        self._cards = self._images * 2
        random.shuffle(self._cards)
        num_cards = NUM_PAIRS * 2

        # Reset state
        self._revealed = [False] * num_cards
        self._matched  = [False] * num_cards
        self._first    = None
        self._second   = None
        self._lock     = False
        self._attempts = 0

        # Reset labels
        self._attempts_label.config(text="ניסיונות: 0", font=("Arial", 22), fg="white")
        self._timer_label.config(text="זמן: 00:00")

        # Hide victory elements
        self._play_again_btn.pack_forget()

        # Create buttons
        self._buttons = []
        for i in range(num_cards):
            btn = tk.Button(
                self._board_frame,
                image=self._back_image,
                width=self._card_size[0],
                height=self._card_size[1],
                command=lambda i=i: self._on_card_click(i),
                relief="raised", bd=4
            )
            btn.grid(row=i // COLS, column=i % COLS, padx=10, pady=10, sticky="nsew")
            self._buttons.append(btn)

        # Start timer
        self._start_time = time.monotonic()
        self._tick()

    def _tick(self):
        elapsed = time.monotonic() - self._start_time
        minutes = int(elapsed) // 60
        seconds = int(elapsed) % 60
        self._timer_label.config(text=f"זמן: {minutes:02d}:{seconds:02d}")
        self._timer_id = self.root.after(1000, self._tick)

    def _on_card_click(self, index):
        if self._lock or self._revealed[index] or self._matched[index]:
            return

        self._buttons[index].config(image=self._cards[index])
        self._revealed[index] = True

        if self._first is None:
            self._first = index
        else:
            self._second = index
            self._lock = True
            self._attempts += 1
            self._attempts_label.config(text=f"ניסיונות: {self._attempts}")
            self.root.after(FLIP_DELAY, self._check_match)

    def _check_match(self):
        if self._cards[self._first] == self._cards[self._second]:
            self._matched[self._first] = True
            self._matched[self._second] = True
        else:
            self._buttons[self._first].config(image=self._back_image)
            self._buttons[self._second].config(image=self._back_image)
            self._revealed[self._first] = False
            self._revealed[self._second] = False

        self._first = None
        self._second = None
        self._lock = False

        if all(self._matched):
            self._on_win()

    def _on_win(self):
        # Stop timer
        if self._timer_id is not None:
            self.root.after_cancel(self._timer_id)
            self._timer_id = None

        elapsed = time.monotonic() - self._start_time
        minutes = int(elapsed) // 60
        seconds = int(elapsed) % 60
        time_str = f"{minutes:02d}:{seconds:02d}"

        msg = VICTORY_MESSAGE.format(steps=self._attempts, time=time_str)
        self._attempts_label.config(
            text=msg,
            font=("Arial", 20), fg="#FFD700"
        )
        self._play_again_btn.pack(pady=20)


# ================================
# Entry point
# ================================
if __name__ == "__main__":
    root = tk.Tk()
    root.title("משחק זיכרון ❤️")
    root.attributes("-fullscreen", True)

    if not os.path.isdir(IMAGES_DIR):
        messagebox.showerror("תיקייה חסרה", f"לא נמצאה תיקיית תמונות: '{IMAGES_DIR}'")
        raise SystemExit(1)

    GameBoard(root)
    root.mainloop()
