

import tkinter as tk
from PIL import Image, ImageTk
import random
import os
import tkinter.messagebox

# -------------------------------
# הגדרות
# -------------------------------
NUM_PAIRS = 5
ROWS = 2
COLS = 5
folder = "images"
valid_extensions = (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".jfif")

root = tk.Tk()
root.title("משחק זיכרון ❤️")
root.attributes("-fullscreen", True)

screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()

CARD_WIDTH = screen_width // COLS - 40
CARD_HEIGHT = screen_height // ROWS - 40
CARD_SIZE = (CARD_WIDTH, CARD_HEIGHT)

# -------------------------------
# טעינת תמונות
# -------------------------------
files = [f for f in os.listdir(folder)
         if f.lower().endswith(valid_extensions) and f.lower() != "back.png"]

if len(files) < NUM_PAIRS:
    raise ValueError(f"צריך לפחות {NUM_PAIRS} תמונות בתיקייה!")

files = files[:NUM_PAIRS]

images = []
for file in files:
    path = os.path.join(folder, file)
    img = Image.open(path).resize(CARD_SIZE)
    images.append(ImageTk.PhotoImage(img))

back_path = os.path.join(folder, "back.png")
if os.path.exists(back_path):
    back_image_raw = Image.open(back_path).resize(CARD_SIZE)
else:
    back_image_raw = Image.new("RGB", CARD_SIZE, color="gray")
back_image = ImageTk.PhotoImage(back_image_raw)

# -------------------------------
# הכפלת קלפים וערבוב
# -------------------------------
cards = images * 2
random.shuffle(cards)
NUM_CARDS = NUM_PAIRS * 2

buttons = []
revealed = [False] * NUM_CARDS
matched = [False] * NUM_CARDS
first = None
second = None
lock = False
attempts = 0  # ספירת צעדים

# -------------------------------
# פונקציות משחק
# -------------------------------
def click(index):
    global first, second, lock, attempts

    if lock or revealed[index] or matched[index]:
        return

    buttons[index].config(image=cards[index])
    revealed[index] = True

    if not first:
        first = index
    else:
        second = index
        lock = True
        attempts += 1
        attempts_label.config(text=f"ניסיונות: {attempts}")
        root.after(800, check)

def check():
    global first, second, lock

    if cards[first] == cards[second]:
        matched[first] = True
        matched[second] = True
    else:
        buttons[first].config(image=back_image)
        buttons[second].config(image=back_image)
        revealed[first] = False
        revealed[second] = False

    first_index = first
    second_index = second
    first = None
    second = None
    lock = False

    if all(matched):
        # -------------------------------
        # מסך ניצחון מותאם אישית
        # -------------------------------
        tk.messagebox.showinfo(
            "🎉 כל הכבוד! 🎉",
            "happy birthday shachar i love you\n\n" +
            f"סיימת את המשחק ב-{attempts} צעדים!"
        )

# -------------------------------
# יצירת לוח קלפים
# -------------------------------
board_frame = tk.Frame(root, bg="#333")
board_frame.pack(expand=True)

for i in range(NUM_CARDS):
    btn = tk.Button(board_frame, image=back_image,
                    width=CARD_SIZE[0], height=CARD_SIZE[1],
                    command=lambda i=i: click(i),
                    relief="raised", bd=4)
    btn.grid(row=i // COLS, column=i % COLS, padx=10, pady=10, sticky="nsew")
    buttons.append(btn)

# התאמת גריד לגודל החלון
for r in range(ROWS):
    board_frame.grid_rowconfigure(r, weight=1)
for c in range(COLS):
    board_frame.grid_columnconfigure(c, weight=1)

# -------------------------------
# תצוגת ניסיונות
# -------------------------------
attempts_label = tk.Label(root, text=f"ניסיונות: {attempts}", font=("Arial", 24), bg="#222", fg="white")
attempts_label.pack(pady=20)

# -------------------------------
root.mainloop()

