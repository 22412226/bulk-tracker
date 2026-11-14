"""
Reusable CustomTkinter UI components designed with macOS / Apple Health aesthetics.
Includes Macro Progress Cards, Date Navigator, Meal Rows, and Status Badges.
"""

import customtkinter as ctk
from datetime import datetime, timedelta
from typing import Callable, Optional

from theme import (
    COLOR_BG_CARD, COLOR_BG_CARD_SECONDARY, COLOR_BG_CARD_HOVER,
    COLOR_BORDER, COLOR_BORDER_LIGHT,
    COLOR_TEXT_PRIMARY, COLOR_TEXT_SECONDARY, COLOR_TEXT_MUTED,
    COLOR_CALORIES, COLOR_PROTEIN, COLOR_CARBS, COLOR_FATS,
    COLOR_SUCCESS, COLOR_SURPLUS_ACCENT, COLOR_DANGER,
    CORNER_RADIUS_CARD, CORNER_RADIUS_BUTTON, FONT_FAMILY
)
from models import LoggedMeal


class MacroProgressCard(ctk.CTkFrame):
    """
    Apple Health inspired summary card showing current vs target and remaining,
    with a progress bar and friendly surplus highlighting.
    """

    def __init__(
        self,
        master,
        title: str,
        unit: str,
        accent_color: str,
        is_large: bool = False,
        **kwargs
    ):
        super().__init__(
            master,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER,
            **kwargs
        )
        self.title_text = title
        self.unit = unit
        self.accent_color = accent_color
        self.is_large = is_large

        self._build_ui()

    def _build_ui(self) -> None:
        self.grid_columnconfigure(0, weight=1)

        pad_x = 16
        pad_y = 14 if not self.is_large else 18

        # Header Row: Indicator dot + Title
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.grid(row=0, column=0, sticky="ew", padx=pad_x, pady=(pad_y, 4))
        header_frame.grid_columnconfigure(1, weight=1)

        # Dot
        self.dot = ctk.CTkFrame(
            header_frame,
            width=10,
            height=10,
            corner_radius=5,
            fg_color=self.accent_color
        )
        self.dot.grid(row=0, column=0, padx=(0, 8), pady=2)

        title_size = 14 if not self.is_large else 16
        self.lbl_title = ctk.CTkLabel(
            header_frame,
            text=self.title_text.upper(),
            font=ctk.CTkFont(family=FONT_FAMILY, size=title_size, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY,
            anchor="w"
        )
        self.lbl_title.grid(row=0, column=1, sticky="w")

        # Percentage Badge
        self.lbl_percent = ctk.CTkLabel(
            header_frame,
            text="0%",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=self.accent_color,
            anchor="e"
        )
        self.lbl_percent.grid(row=0, column=2, sticky="e")

        # Main Value Display (e.g., 2,150 / 2,900 kcal)
        val_size = 22 if not self.is_large else 28
        self.lbl_values = ctk.CTkLabel(
            self,
            text=f"0 / 0 {self.unit}",
            font=ctk.CTkFont(family=FONT_FAMILY, size=val_size, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
            anchor="w"
        )
        self.lbl_values.grid(row=1, column=0, sticky="w", padx=pad_x, pady=(2, 6))

        # Progress Bar
        self.progress_bar = ctk.CTkProgressBar(
            self,
            height=8 if not self.is_large else 12,
            corner_radius=4 if not self.is_large else 6,
            progress_color=self.accent_color,
            fg_color="#262a36"
        )
        self.progress_bar.set(0.0)
        self.progress_bar.grid(row=2, column=0, sticky="ew", padx=pad_x, pady=(2, 6))

        # Status / Remaining Row
        self.lbl_status = ctk.CTkLabel(
            self,
            text="0 remaining",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12),
            text_color=COLOR_TEXT_MUTED,
            anchor="w"
        )
        self.lbl_status.grid(row=3, column=0, sticky="w", padx=pad_x, pady=(0, pad_y))

    def update_values(self, current: float, target: float) -> None:
        """Updates numeric values, progress bar, and friendly surplus messaging."""
        target = max(1.0, target)
        ratio = min(1.0, current / target)
        self.progress_bar.set(ratio)

        pct = int(round((current / target) * 100))
        self.lbl_percent.configure(text=f"{pct}%")

        if self.unit == "kcal":
            val_str = f"{int(round(current)):,} / {int(round(target)):,} {self.unit}"
        else:
            val_str = f"{current:.1f} / {target:.1f} {self.unit}"
        self.lbl_values.configure(text=val_str)

        diff = target - current
        if diff > 0.5:
            # Still remaining
            rem_str = f"{int(round(diff))} {self.unit} remaining" if self.unit == "kcal" else f"{diff:.1f} {self.unit} remaining"
            self.lbl_status.configure(text=rem_str, text_color=COLOR_TEXT_MUTED)
            self.progress_bar.configure(progress_color=self.accent_color)
        else:
            # Target met or surplus achieved
            surplus = current - target
            if surplus >= 0.5:
                surplus_text = f"★ Surplus Goal Met (+{int(round(surplus))} {self.unit})" if self.unit == "kcal" else f"★ Target Met (+{surplus:.1f} {self.unit})"
                self.lbl_status.configure(text=surplus_text, text_color=COLOR_SURPLUS_ACCENT)
                self.progress_bar.configure(progress_color=COLOR_SURPLUS_ACCENT)
            else:
                self.lbl_status.configure(text="✓ Target Reached!", text_color=COLOR_SUCCESS)
                self.progress_bar.configure(progress_color=COLOR_SUCCESS)


class DateNavigator(ctk.CTkFrame):
    """
    Sleek date switcher with Yesterday/Today/Tomorrow shortcuts and previous/next buttons.
    """

    def __init__(
        self,
        master,
        initial_date: datetime,
        on_date_change: Callable[[str], None],
        **kwargs
    ):
        super().__init__(
            master,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER,
            **kwargs
        )
        self.current_date = initial_date
        self.on_date_change = on_date_change

        self._build_ui()
        self._update_display()

    def _build_ui(self) -> None:
        self.grid_columnconfigure(3, weight=1)

        # Left arrow
        self.btn_prev = ctk.CTkButton(
            self,
            text="◀",
            width=38,
            height=32,
            corner_radius=CORNER_RADIUS_BUTTON,
            fg_color=COLOR_BG_CARD_SECONDARY,
            hover_color=COLOR_BG_CARD_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            command=self._on_prev_day
        )
        self.btn_prev.grid(row=0, column=0, padx=(10, 4), pady=8)

        # Yesterday shortcut
        self.btn_yesterday = ctk.CTkButton(
            self,
            text="Yesterday",
            width=80,
            height=32,
            corner_radius=CORNER_RADIUS_BUTTON,
            fg_color=COLOR_BG_CARD_SECONDARY,
            hover_color=COLOR_BG_CARD_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            command=self._on_yesterday
        )
        self.btn_yesterday.grid(row=0, column=1, padx=4, pady=8)

        # Today shortcut
        self.btn_today = ctk.CTkButton(
            self,
            text="Today",
            width=70,
            height=32,
            corner_radius=CORNER_RADIUS_BUTTON,
            fg_color=COLOR_BORDER_LIGHT,
            hover_color=COLOR_BG_CARD_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            font=ctk.CTkFont(family=FONT_FAMILY, weight="bold"),
            command=self._on_today
        )
        self.btn_today.grid(row=0, column=2, padx=4, pady=8)

        # Date Label Display (Center)
        self.lbl_date = ctk.CTkLabel(
            self,
            text="",
            font=ctk.CTkFont(family=FONT_FAMILY, size=15, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
            anchor="center"
        )
        self.lbl_date.grid(row=0, column=3, sticky="ew", padx=10, pady=8)

        # Right arrow
        self.btn_next = ctk.CTkButton(
            self,
            text="▶",
            width=38,
            height=32,
            corner_radius=CORNER_RADIUS_BUTTON,
            fg_color=COLOR_BG_CARD_SECONDARY,
            hover_color=COLOR_BG_CARD_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            command=self._on_next_day
        )
        self.btn_next.grid(row=0, column=4, padx=(4, 10), pady=8)

    def _on_prev_day(self) -> None:
        self.current_date -= timedelta(days=1)
        self._update_display()

    def _on_next_day(self) -> None:
        self.current_date += timedelta(days=1)
        self._update_display()

    def _on_today(self) -> None:
        self.current_date = datetime.now()
        self._update_display()

    def _on_yesterday(self) -> None:
        self.current_date = datetime.now() - timedelta(days=1)
        self._update_display()

    def set_date_str(self, date_str: str) -> None:
        try:
            self.current_date = datetime.strptime(date_str, "%Y-%m-%d")
            self._update_display()
        except ValueError:
            pass

    def get_date_str(self) -> str:
        return self.current_date.strftime("%Y-%m-%d")

    def _update_display(self) -> None:
        date_str = self.get_date_str()
        today_str = datetime.now().strftime("%Y-%m-%d")
        yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

        if date_str == today_str:
            display_title = f"Today, {self.current_date.strftime('%A, %b %d')}"
        elif date_str == yesterday_str:
            display_title = f"Yesterday, {self.current_date.strftime('%A, %b %d')}"
        else:
            display_title = self.current_date.strftime("%A, %B %d, %Y")

        self.lbl_date.configure(text=display_title)
        self.on_date_change(date_str)


class LoggedMealRow(ctk.CTkFrame):
    """
    Sleek list row displaying a meal item with macro tags and quick edit/delete buttons.
    """

    def __init__(
        self,
        master,
        meal: LoggedMeal,
        on_edit: Callable[[LoggedMeal], None],
        on_delete: Callable[[str], None],
        **kwargs
    ):
        super().__init__(
            master,
            fg_color=COLOR_BG_CARD_SECONDARY,
            corner_radius=8,
            border_width=1,
            border_color=COLOR_BORDER,
            **kwargs
        )
        self.meal = meal
        self.on_edit = on_edit
        self.on_delete = on_delete

        self._build_ui()

    def _build_ui(self) -> None:
        self.grid_columnconfigure(0, weight=1)

        # Left: Name and Quantity
        left_frame = ctk.CTkFrame(self, fg_color="transparent")
        left_frame.grid(row=0, column=0, sticky="w", padx=12, pady=10)

        lbl_name = ctk.CTkLabel(
            left_frame,
            text=self.meal.name,
            font=ctk.CTkFont(family=FONT_FAMILY, size=14, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY,
            anchor="w"
        )
        lbl_name.grid(row=0, column=0, sticky="w")

        portion_text = f"{self.meal.quantity:g} {self.meal.unit_label}"
        lbl_portion = ctk.CTkLabel(
            left_frame,
            text=f"• {portion_text}",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12),
            text_color=COLOR_TEXT_MUTED,
            anchor="w"
        )
        lbl_portion.grid(row=0, column=1, sticky="w", padx=(6, 0))

        # Right: Macro Pills + Edit + Delete
        right_frame = ctk.CTkFrame(self, fg_color="transparent")
        right_frame.grid(row=0, column=1, sticky="e", padx=10, pady=10)

        # Macro Badges
        cals_badge = ctk.CTkLabel(
            right_frame,
            text=f"{int(round(self.meal.calories))} kcal",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_CALORIES,
            fg_color="#362106",
            corner_radius=6,
            padx=8,
            pady=3
        )
        cals_badge.grid(row=0, column=0, padx=3)

        p_badge = ctk.CTkLabel(
            right_frame,
            text=f"{self.meal.protein:.1f}g P",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_PROTEIN,
            fg_color="#0d2838",
            corner_radius=6,
            padx=8,
            pady=3
        )
        p_badge.grid(row=0, column=1, padx=3)

        c_badge = ctk.CTkLabel(
            right_frame,
            text=f"{self.meal.carbs:.1f}g C",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_CARBS,
            fg_color="#0d3526",
            corner_radius=6,
            padx=8,
            pady=3
        )
        c_badge.grid(row=0, column=2, padx=3)

        f_badge = ctk.CTkLabel(
            right_frame,
            text=f"{self.meal.fat:.1f}g F",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_FATS,
            fg_color="#392b0c",
            corner_radius=6,
            padx=8,
            pady=3
        )
        f_badge.grid(row=0, column=3, padx=3)

        # Edit button
        btn_edit = ctk.CTkButton(
            right_frame,
            text="✎",
            width=28,
            height=26,
            corner_radius=6,
            fg_color="transparent",
            hover_color=COLOR_BG_CARD_HOVER,
            text_color=COLOR_TEXT_SECONDARY,
            font=ctk.CTkFont(size=14),
            command=lambda: self.on_edit(self.meal)
        )
        btn_edit.grid(row=0, column=4, padx=(8, 2))

        # Delete button
        btn_del = ctk.CTkButton(
            right_frame,
            text="✕",
            width=28,
            height=26,
            corner_radius=6,
            fg_color="transparent",
            hover_color="#3b151e",
            text_color=COLOR_DANGER,
            font=ctk.CTkFont(size=13, weight="bold"),
            command=lambda: self.on_delete(self.meal.id)
        )
        btn_del.grid(row=0, column=5, padx=2)
