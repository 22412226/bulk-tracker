"""
Dashboard View: Daily macro progress cards, meal time categories, and fast logging controls.
"""

import customtkinter as ctk
from datetime import datetime
from typing import Callable, Optional, Dict, List

from theme import (
    COLOR_BG_ROOT, COLOR_BG_CARD, COLOR_BG_CARD_SECONDARY, COLOR_BG_CARD_HOVER,
    COLOR_BORDER, COLOR_BORDER_LIGHT,
    COLOR_TEXT_PRIMARY, COLOR_TEXT_SECONDARY, COLOR_TEXT_MUTED,
    COLOR_CALORIES, COLOR_PROTEIN, COLOR_CARBS, COLOR_FATS,
    COLOR_ACCENT_PRIMARY, COLOR_ACCENT_HOVER, COLOR_SUCCESS,
    CORNER_RADIUS_CARD, CORNER_RADIUS_BUTTON, FONT_FAMILY
)
from models import LoggedMeal, FoodItem, UserSettings
from database import Database
from ui_components import MacroProgressCard, DateNavigator, LoggedMealRow
from dialogs import QuickAddDialog, ManualAddDialog, EditMealDialog


class DashboardView(ctk.CTkFrame):
    """
    Main dashboard tracking daily food intake, meal timeline, and progress towards bulking goals.
    """

    def __init__(self, master, db: Database, on_data_changed: Callable[[], None], **kwargs):
        super().__init__(master, fg_color=COLOR_BG_ROOT, **kwargs)
        self.db = db
        self.on_data_changed = on_data_changed
        self.current_date_str = datetime.now().strftime("%Y-%m-%d")

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        self._build_top_controls()
        self._build_macro_cards()
        self._build_meals_scrollable_area()

        self.refresh()

    def _build_top_controls(self) -> None:
        """Top section: Date switcher and primary action bar."""
        top_container = ctk.CTkFrame(self, fg_color="transparent")
        top_container.grid(row=0, column=0, sticky="ew", padx=24, pady=(16, 10))
        top_container.grid_columnconfigure(0, weight=1)

        # Feedback notification banner (created early)
        self.lbl_feedback = ctk.CTkLabel(
            top_container,
            text="",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_SUCCESS
        )

        # Date Navigator
        self.date_nav = DateNavigator(
            top_container,
            initial_date=datetime.now(),
            on_date_change=self._on_date_changed
        )
        self.date_nav.grid(row=0, column=0, sticky="ew", pady=(0, 10))

        # Action Buttons Bar
        actions_bar = ctk.CTkFrame(top_container, fg_color="transparent")
        actions_bar.grid(row=1, column=0, sticky="ew")
        actions_bar.grid_columnconfigure((0, 1, 2), weight=1)

        # 1. Quick Add
        btn_quick = ctk.CTkButton(
            actions_bar,
            text="⚡ Quick Add (Library)",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            corner_radius=CORNER_RADIUS_BUTTON,
            height=36,
            command=lambda: self._open_quick_add()
        )
        btn_quick.grid(row=0, column=0, padx=(0, 6), sticky="ew")

        # 2. Manual Add
        btn_manual = ctk.CTkButton(
            actions_bar,
            text="✏️ Custom / Manual Entry",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13),
            fg_color=COLOR_BG_CARD,
            hover_color=COLOR_BG_CARD_HOVER,
            border_width=1,
            border_color=COLOR_BORDER,
            text_color=COLOR_TEXT_PRIMARY,
            corner_radius=CORNER_RADIUS_BUTTON,
            height=36,
            command=lambda: self._open_manual_add()
        )
        btn_manual.grid(row=0, column=1, padx=4, sticky="ew")

        # 3. Copy Yesterday's Meals
        btn_copy = ctk.CTkButton(
            actions_bar,
            text="📋 Copy Yesterday's Meals",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13),
            fg_color=COLOR_BG_CARD,
            hover_color=COLOR_BG_CARD_HOVER,
            border_width=1,
            border_color=COLOR_BORDER,
            text_color=COLOR_TEXT_PRIMARY,
            corner_radius=CORNER_RADIUS_BUTTON,
            height=36,
            command=self._on_copy_yesterday
        )
        btn_copy.grid(row=0, column=2, padx=(6, 0), sticky="ew")

        # Place feedback banner below actions
        self.lbl_feedback.grid(row=2, column=0, sticky="w", padx=4, pady=(4, 0))

    def _build_macro_cards(self) -> None:
        """Macro Progress overview cards inspired by Apple Health."""
        cards_container = ctk.CTkFrame(self, fg_color="transparent")
        cards_container.grid(row=1, column=0, sticky="ew", padx=24, pady=(0, 12))
        cards_container.grid_columnconfigure((0, 1, 2, 3), weight=1)

        # Calories (prominent)
        self.card_cals = MacroProgressCard(
            cards_container,
            title="Calories",
            unit="kcal",
            accent_color=COLOR_CALORIES,
            is_large=True
        )
        self.card_cals.grid(row=0, column=0, padx=(0, 6), sticky="nsew")

        # Protein
        self.card_protein = MacroProgressCard(
            cards_container,
            title="Protein",
            unit="g",
            accent_color=COLOR_PROTEIN
        )
        self.card_protein.grid(row=0, column=1, padx=4, sticky="nsew")

        # Carbs
        self.card_carbs = MacroProgressCard(
            cards_container,
            title="Carbs",
            unit="g",
            accent_color=COLOR_CARBS
        )
        self.card_carbs.grid(row=0, column=2, padx=4, sticky="nsew")

        # Fats
        self.card_fats = MacroProgressCard(
            cards_container,
            title="Fats",
            unit="g",
            accent_color=COLOR_FATS
        )
        self.card_fats.grid(row=0, column=3, padx=(6, 0), sticky="nsew")

    def _build_meals_scrollable_area(self) -> None:
        """Scrollable section for meal groups: Breakfast, Lunch, Dinner, Snacks/Shakes."""
        self.scroll_area = ctk.CTkScrollableFrame(
            self,
            fg_color="transparent"
        )
        self.scroll_area.grid(row=2, column=0, sticky="nsew", padx=24, pady=(0, 16))
        self.scroll_area.grid_columnconfigure(0, weight=1)

    def _on_date_changed(self, new_date_str: str) -> None:
        self.current_date_str = new_date_str
        if hasattr(self, "lbl_feedback"):
            self.lbl_feedback.configure(text="")
        if hasattr(self, "scroll_area") and hasattr(self, "card_cals"):
            self.refresh()

    def _on_copy_yesterday(self) -> None:
        copied_count = self.db.copy_yesterday_meals(self.current_date_str)
        if copied_count > 0:
            self.lbl_feedback.configure(
                text=f"✓ Successfully copied {copied_count} meals from yesterday!",
                text_color=COLOR_SUCCESS
            )
        else:
            self.lbl_feedback.configure(
                text="ℹ No meals found on yesterday's date to copy.",
                text_color=COLOR_TEXT_SECONDARY
            )
        self.refresh()
        self.on_data_changed()

    def _open_quick_add(self, meal_type: str = "Lunch") -> None:
        foods = self.db.get_all_foods()
        QuickAddDialog(
            self,
            foods=foods,
            default_meal_type=meal_type,
            on_add=self._add_logged_meal
        )

    def _open_manual_add(self, meal_type: str = "Lunch") -> None:
        ManualAddDialog(
            self,
            default_meal_type=meal_type,
            on_add=self._add_logged_meal
        )

    def _open_edit_meal(self, meal: LoggedMeal) -> None:
        EditMealDialog(
            self,
            meal=meal,
            on_save=lambda updated: self._save_edited_meal(updated)
        )

    def _add_logged_meal(self, meal: LoggedMeal) -> None:
        self.db.add_meal(self.current_date_str, meal)
        self.lbl_feedback.configure(text=f"✓ Logged {meal.name} into {meal.meal_type}!", text_color=COLOR_SUCCESS)
        self.refresh()
        self.on_data_changed()

    def _save_edited_meal(self, updated: LoggedMeal) -> None:
        self.db.update_meal(self.current_date_str, updated)
        self.refresh()
        self.on_data_changed()

    def _delete_meal(self, meal_id: str) -> None:
        self.db.delete_meal(self.current_date_str, meal_id)
        self.refresh()
        self.on_data_changed()

    def refresh(self) -> None:
        """Refreshes macro summary counters and populates all meal sections."""
        # 1. Update Macro Cards
        settings = self.db.get_settings()
        targets = settings.get_effective_targets()
        totals = self.db.get_daily_totals(self.current_date_str)

        self.card_cals.update_values(totals["calories"], targets["calories"])
        self.card_protein.update_values(totals["protein"], targets["protein"])
        self.card_carbs.update_values(totals["carbs"], targets["carbs"])
        self.card_fats.update_values(totals["fat"], targets["fat"])

        # 2. Rebuild Meal Sections
        for widget in self.scroll_area.winfo_children():
            widget.destroy()

        all_meals = self.db.get_meals_for_date(self.current_date_str)
        meal_groups = {
            "Breakfast": [m for m in all_meals if m.meal_type == "Breakfast"],
            "Lunch": [m for m in all_meals if m.meal_type == "Lunch"],
            "Dinner": [m for m in all_meals if m.meal_type == "Dinner"],
            "Snacks/Shakes": [m for m in all_meals if m.meal_type in ["Snacks/Shakes", "Snacks"]]
        }

        # If zero meals for this day, render a sleek empty state
        if not all_meals:
            empty_card = ctk.CTkFrame(
                self.scroll_area,
                fg_color=COLOR_BG_CARD,
                corner_radius=CORNER_RADIUS_CARD,
                border_width=1,
                border_color=COLOR_BORDER
            )
            empty_card.grid(row=0, column=0, sticky="ew", pady=16, padx=4)
            empty_card.grid_columnconfigure(0, weight=1)

            ctk.CTkLabel(
                empty_card,
                text="🥣 No meals logged for this date yet",
                font=ctk.CTkFont(family=FONT_FAMILY, size=16, weight="bold"),
                text_color=COLOR_TEXT_PRIMARY
            ).grid(row=0, column=0, pady=(24, 6))

            ctk.CTkLabel(
                empty_card,
                text="Use 'Quick Add' to select your staples or 'Copy Yesterday's Meals' to fill your day in 1-click.",
                font=ctk.CTkFont(family=FONT_FAMILY, size=13),
                text_color=COLOR_TEXT_MUTED
            ).grid(row=1, column=0, pady=(0, 24))
            return

        row_idx = 0
        for category_name, meals in meal_groups.items():
            section_frame = ctk.CTkFrame(
                self.scroll_area,
                fg_color=COLOR_BG_CARD,
                corner_radius=CORNER_RADIUS_CARD,
                border_width=1,
                border_color=COLOR_BORDER
            )
            section_frame.grid(row=row_idx, column=0, sticky="ew", pady=(0, 14), padx=2)
            section_frame.grid_columnconfigure(0, weight=1)
            row_idx += 1

            # Header of Section
            sec_header = ctk.CTkFrame(section_frame, fg_color="transparent")
            sec_header.grid(row=0, column=0, sticky="ew", padx=16, pady=(12, 8))
            sec_header.grid_columnconfigure(0, weight=1)

            # Subtotal for section
            sec_cals = int(round(sum(m.calories for m in meals)))
            sec_p = round(sum(m.protein for m in meals), 1)

            cat_title = f"{category_name}"
            lbl_cat = ctk.CTkLabel(
                sec_header,
                text=cat_title,
                font=ctk.CTkFont(family=FONT_FAMILY, size=15, weight="bold"),
                text_color=COLOR_TEXT_PRIMARY
            )
            lbl_cat.grid(row=0, column=0, sticky="w")

            if meals:
                sub_txt = f"{sec_cals} kcal • {sec_p}g P"
                lbl_sub = ctk.CTkLabel(
                    sec_header,
                    text=sub_txt,
                    font=ctk.CTkFont(family=FONT_FAMILY, size=12),
                    text_color=COLOR_TEXT_MUTED
                )
                lbl_sub.grid(row=0, column=1, sticky="e", padx=(0, 10))

            # Quick + button for this category
            btn_add_sec = ctk.CTkButton(
                sec_header,
                text="+ Add",
                width=60,
                height=26,
                corner_radius=6,
                font=ctk.CTkFont(size=12, weight="bold"),
                fg_color=COLOR_BG_CARD_SECONDARY,
                hover_color=COLOR_BORDER_LIGHT,
                text_color=COLOR_TEXT_PRIMARY,
                command=lambda cat=category_name: self._open_quick_add(cat)
            )
            btn_add_sec.grid(row=0, column=2, sticky="e")

            # Content rows
            if not meals:
                empty_lbl = ctk.CTkLabel(
                    section_frame,
                    text="Nothing logged yet",
                    font=ctk.CTkFont(size=12),
                    text_color=COLOR_TEXT_MUTED
                )
                empty_lbl.grid(row=1, column=0, sticky="w", padx=16, pady=(4, 12))
            else:
                for idx, meal_item in enumerate(meals, start=1):
                    meal_row = LoggedMealRow(
                        section_frame,
                        meal=meal_item,
                        on_edit=self._open_edit_meal,
                        on_delete=self._delete_meal
                    )
                    meal_row.grid(row=idx, column=0, sticky="ew", padx=14, pady=(2, 6))

                # Extra spacing at bottom of section
                ctk.CTkFrame(section_frame, height=4, fg_color="transparent").grid(row=len(meals)+1, column=0)
