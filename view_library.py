"""
Library View: "My Foods & Meals" library for managing staples and custom presets.
"""

import customtkinter as ctk
from typing import Callable, Optional, List

from theme import (
    COLOR_BG_ROOT, COLOR_BG_CARD, COLOR_BG_CARD_SECONDARY, COLOR_BG_CARD_HOVER,
    COLOR_BORDER, COLOR_BORDER_LIGHT, COLOR_BG_INPUT,
    COLOR_TEXT_PRIMARY, COLOR_TEXT_SECONDARY, COLOR_TEXT_MUTED,
    COLOR_CALORIES, COLOR_PROTEIN, COLOR_CARBS, COLOR_FATS,
    COLOR_ACCENT_PRIMARY, COLOR_ACCENT_HOVER, COLOR_DANGER,
    COLOR_SUCCESS, CORNER_RADIUS_CARD, CORNER_RADIUS_BUTTON, FONT_FAMILY
)
from models import FoodItem, LoggedMeal
from database import Database
from dialogs import FoodEditorDialog, QuickAddDialog


class LibraryView(ctk.CTkFrame):
    """
    Searchable catalog of saved foods, recipes, and staples.
    """

    def __init__(self, master, db: Database, on_data_changed: Callable[[], None], **kwargs):
        super().__init__(master, fg_color=COLOR_BG_ROOT, **kwargs)
        self.db = db
        self.on_data_changed = on_data_changed
        self.search_query = ""

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self._build_header()
        self._build_list_area()
        self.refresh()

    def _build_header(self) -> None:
        header_container = ctk.CTkFrame(self, fg_color="transparent")
        header_container.grid(row=0, column=0, sticky="ew", padx=24, pady=(20, 14))
        header_container.grid_columnconfigure(0, weight=1)

        # Title & Subtitle Row
        title_frame = ctk.CTkFrame(header_container, fg_color="transparent")
        title_frame.grid(row=0, column=0, sticky="ew")
        title_frame.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            title_frame,
            text="🥑 My Foods & Meals Library",
            font=ctk.CTkFont(family=FONT_FAMILY, size=20, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        ).grid(row=0, column=0, sticky="w")

        ctk.CTkLabel(
            title_frame,
            text="Pre-calculated staple presets for lightning-fast bulking nutrition logging.",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13),
            text_color=COLOR_TEXT_MUTED
        ).grid(row=1, column=0, sticky="w", pady=(2, 10))

        # Search Bar + New Food Button Row
        bar_frame = ctk.CTkFrame(header_container, fg_color="transparent")
        bar_frame.grid(row=1, column=0, sticky="ew")
        bar_frame.grid_columnconfigure(0, weight=1)

        self.entry_search = ctk.CTkEntry(
            bar_frame,
            placeholder_text="🔍 Search saved foods (e.g. rice, plov, chicken)...",
            height=36,
            fg_color=COLOR_BG_CARD,
            border_color=COLOR_BORDER,
            font=ctk.CTkFont(family=FONT_FAMILY, size=13)
        )
        self.entry_search.grid(row=0, column=0, sticky="ew", padx=(0, 10))
        self.entry_search.bind("<KeyRelease>", self._on_search)

        btn_add = ctk.CTkButton(
            bar_frame,
            text="➕ New Food / Recipe",
            height=36,
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self._open_new_food_dialog
        )
        btn_add.grid(row=0, column=1, sticky="e")

    def _build_list_area(self) -> None:
        self.scroll_area = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll_area.grid(row=1, column=0, sticky="nsew", padx=24, pady=(0, 16))
        self.scroll_area.grid_columnconfigure(0, weight=1)

    def _on_search(self, event=None) -> None:
        self.search_query = self.entry_search.get().strip().lower()
        self.refresh()

    def _open_new_food_dialog(self) -> None:
        FoodEditorDialog(
            self,
            food=None,
            on_save=self._save_food
        )

    def _open_edit_food_dialog(self, food: FoodItem) -> None:
        FoodEditorDialog(
            self,
            food=food,
            on_save=self._save_food
        )

    def _save_food(self, food: FoodItem) -> None:
        self.db.save_food(food)
        self.refresh()
        self.on_data_changed()

    def _delete_food(self, food_id: str) -> None:
        self.db.delete_food(food_id)
        self.refresh()
        self.on_data_changed()

    def refresh(self) -> None:
        """Renders food cards matching the active search filter."""
        for widget in self.scroll_area.winfo_children():
            widget.destroy()

        foods = self.db.get_all_foods()
        if self.search_query:
            foods = [f for f in foods if self.search_query in f.name.lower()]

        if not foods:
            empty_frame = ctk.CTkFrame(
                self.scroll_area,
                fg_color=COLOR_BG_CARD,
                corner_radius=CORNER_RADIUS_CARD,
                border_width=1,
                border_color=COLOR_BORDER
            )
            empty_frame.grid(row=0, column=0, sticky="ew", pady=20)
            empty_frame.grid_columnconfigure(0, weight=1)

            ctk.CTkLabel(
                empty_frame,
                text="No foods found matching your search.",
                font=ctk.CTkFont(family=FONT_FAMILY, size=15, weight="bold"),
                text_color=COLOR_TEXT_PRIMARY
            ).grid(row=0, column=0, pady=(24, 4))

            ctk.CTkLabel(
                empty_frame,
                text="Click '➕ New Food / Recipe' to add a custom staple.",
                font=ctk.CTkFont(family=FONT_FAMILY, size=13),
                text_color=COLOR_TEXT_MUTED
            ).grid(row=1, column=0, pady=(0, 24))
            return

        for idx, item in enumerate(foods):
            card = ctk.CTkFrame(
                self.scroll_area,
                fg_color=COLOR_BG_CARD,
                corner_radius=CORNER_RADIUS_CARD,
                border_width=1,
                border_color=COLOR_BORDER
            )
            card.grid(row=idx, column=0, sticky="ew", pady=(0, 10), padx=2)
            card.grid_columnconfigure(0, weight=1)

            # Left Info
            left_info = ctk.CTkFrame(card, fg_color="transparent")
            left_info.grid(row=0, column=0, sticky="w", padx=16, pady=12)

            name_row = ctk.CTkFrame(left_info, fg_color="transparent")
            name_row.grid(row=0, column=0, sticky="w")

            lbl_name = ctk.CTkLabel(
                name_row,
                text=item.name,
                font=ctk.CTkFont(family=FONT_FAMILY, size=15, weight="bold"),
                text_color=COLOR_TEXT_PRIMARY
            )
            lbl_name.grid(row=0, column=0, sticky="w")

            if item.is_staple:
                staple_pill = ctk.CTkLabel(
                    name_row,
                    text="★ STAPLE",
                    font=ctk.CTkFont(family=FONT_FAMILY, size=10, weight="bold"),
                    text_color="#f59e0b",
                    fg_color="#362506",
                    corner_radius=6,
                    padx=6,
                    pady=2
                )
                staple_pill.grid(row=0, column=1, sticky="w", padx=(8, 0))

            unit_desc = f"Standard: {item.unit_type}"
            if item.serving_desc:
                unit_desc += f" ({item.serving_desc})"

            lbl_desc = ctk.CTkLabel(
                left_info,
                text=unit_desc,
                font=ctk.CTkFont(family=FONT_FAMILY, size=12),
                text_color=COLOR_TEXT_MUTED
            )
            lbl_desc.grid(row=1, column=0, sticky="w", pady=(2, 0))

            # Right Macros & Actions
            right_box = ctk.CTkFrame(card, fg_color="transparent")
            right_box.grid(row=0, column=1, sticky="e", padx=16, pady=12)

            # Macro badges
            lbl_cals = ctk.CTkLabel(
                right_box,
                text=f"{int(round(item.calories))} kcal",
                font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
                text_color=COLOR_CALORIES,
                fg_color="#362106",
                corner_radius=6,
                padx=8,
                pady=4
            )
            lbl_cals.grid(row=0, column=0, padx=3)

            lbl_p = ctk.CTkLabel(
                right_box,
                text=f"{item.protein}g P",
                font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
                text_color=COLOR_PROTEIN,
                fg_color="#0d2838",
                corner_radius=6,
                padx=8,
                pady=4
            )
            lbl_p.grid(row=0, column=1, padx=3)

            lbl_c = ctk.CTkLabel(
                right_box,
                text=f"{item.carbs}g C",
                font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
                text_color=COLOR_CARBS,
                fg_color="#0d3526",
                corner_radius=6,
                padx=8,
                pady=4
            )
            lbl_c.grid(row=0, column=2, padx=3)

            lbl_f = ctk.CTkLabel(
                right_box,
                text=f"{item.fat}g F",
                font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
                text_color=COLOR_FATS,
                fg_color="#392b0c",
                corner_radius=6,
                padx=8,
                pady=4
            )
            lbl_f.grid(row=0, column=3, padx=3)

            # Edit Button
            btn_edit = ctk.CTkButton(
                right_box,
                text="✎ Edit",
                width=64,
                height=28,
                corner_radius=6,
                fg_color=COLOR_BG_CARD_SECONDARY,
                hover_color=COLOR_BORDER_LIGHT,
                text_color=COLOR_TEXT_PRIMARY,
                font=ctk.CTkFont(size=12),
                command=lambda f=item: self._open_edit_food_dialog(f)
            )
            btn_edit.grid(row=0, column=4, padx=(10, 4))

            # Delete Button
            btn_del = ctk.CTkButton(
                right_box,
                text="✕",
                width=30,
                height=28,
                corner_radius=6,
                fg_color="transparent",
                hover_color="#3b151e",
                text_color=COLOR_DANGER,
                font=ctk.CTkFont(size=13, weight="bold"),
                command=lambda fid=item.id: self._delete_food(fid)
            )
            btn_del.grid(row=0, column=5, padx=2)
