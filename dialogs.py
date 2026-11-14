"""
Modal dialogs for Quick Add from Library, Manual Meal Entry, Food Preset Editing, and Date Jump.
Styled with CustomTkinter and Apple Health dark mode aesthetics.
"""

import customtkinter as ctk
from datetime import datetime
from typing import Callable, Optional, List

from theme import (
    COLOR_BG_ROOT, COLOR_BG_CARD, COLOR_BG_CARD_SECONDARY, COLOR_BG_INPUT,
    COLOR_BORDER, COLOR_BORDER_LIGHT,
    COLOR_TEXT_PRIMARY, COLOR_TEXT_SECONDARY, COLOR_TEXT_MUTED,
    COLOR_CALORIES, COLOR_PROTEIN, COLOR_CARBS, COLOR_FATS,
    COLOR_ACCENT_PRIMARY, COLOR_ACCENT_HOVER, COLOR_DANGER,
    CORNER_RADIUS_CARD, CORNER_RADIUS_BUTTON, CORNER_RADIUS_INPUT, FONT_FAMILY
)
from models import FoodItem, LoggedMeal


class QuickAddDialog(ctk.CTkToplevel):
    """
    Fast Quick-Add dialog allowing the user to select from saved presets,
    enter grams/servings, and preview real-time calculated macros before adding.
    """

    def __init__(
        self,
        master,
        foods: List[FoodItem],
        default_meal_type: str,
        on_add: Callable[[LoggedMeal], None]
    ):
        super().__init__(master)
        self.foods = foods
        self.default_meal_type = default_meal_type
        self.on_add = on_add
        self.selected_food: Optional[FoodItem] = foods[0] if foods else None

        self.title("Quick Add Meal")
        self.geometry("480x560")
        self.resizable(False, False)
        self.configure(fg_color=COLOR_BG_ROOT)

        # Center and make transient
        self.transient(master)
        self.grab_set()

        self._build_ui()
        if self.selected_food:
            self._update_preview()

    def _build_ui(self) -> None:
        self.grid_columnconfigure(0, weight=1)

        # Container Card
        container = ctk.CTkFrame(
            self,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER
        )
        container.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        container.grid_columnconfigure(0, weight=1)

        # Title
        lbl_head = ctk.CTkLabel(
            container,
            text="⚡ Quick Add from Library",
            font=ctk.CTkFont(family=FONT_FAMILY, size=18, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        lbl_head.grid(row=0, column=0, padx=20, pady=(18, 12), sticky="w")

        # 1. Food Selector
        ctk.CTkLabel(
            container,
            text="Select Food or Staple:",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY
        ).grid(row=1, column=0, padx=20, pady=(6, 2), sticky="w")

        food_names = [f.name for f in self.foods] if self.foods else ["No foods in library"]
        self.var_food = ctk.StringVar(value=food_names[0] if food_names else "")
        self.combo_food = ctk.CTkComboBox(
            container,
            values=food_names,
            variable=self.var_food,
            font=ctk.CTkFont(family=FONT_FAMILY, size=13),
            dropdown_font=ctk.CTkFont(family=FONT_FAMILY, size=12),
            fg_color=COLOR_BG_INPUT,
            border_color=COLOR_BORDER,
            button_color=COLOR_ACCENT_PRIMARY,
            command=self._on_food_changed
        )
        self.combo_food.grid(row=2, column=0, padx=20, pady=(0, 10), sticky="ew")

        # 2. Meal Category
        ctk.CTkLabel(
            container,
            text="Meal Time:",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY
        ).grid(row=3, column=0, padx=20, pady=(4, 2), sticky="w")

        meal_types = ["Breakfast", "Lunch", "Dinner", "Snacks/Shakes"]
        initial_mt = self.default_meal_type if self.default_meal_type in meal_types else "Lunch"
        self.var_meal_type = ctk.StringVar(value=initial_mt)
        self.seg_meal = ctk.CTkSegmentedButton(
            container,
            values=meal_types,
            variable=self.var_meal_type,
            selected_color=COLOR_ACCENT_PRIMARY,
            selected_hover_color=COLOR_ACCENT_HOVER,
            unselected_color=COLOR_BG_INPUT,
            font=ctk.CTkFont(family=FONT_FAMILY, size=11, weight="bold")
        )
        self.seg_meal.grid(row=4, column=0, padx=20, pady=(0, 12), sticky="ew")

        # 3. Quantity / Servings Entry
        self.lbl_amount = ctk.CTkLabel(
            container,
            text="Portion Amount (grams):",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY
        )
        self.lbl_amount.grid(row=5, column=0, padx=20, pady=(4, 2), sticky="w")

        self.var_amount = ctk.StringVar(value="100")
        self.var_amount.trace_add("write", lambda *_: self._update_preview())
        self.entry_amount = ctk.CTkEntry(
            container,
            textvariable=self.var_amount,
            font=ctk.CTkFont(family=FONT_FAMILY, size=14),
            fg_color=COLOR_BG_INPUT,
            border_color=COLOR_BORDER,
            placeholder_text="e.g. 200"
        )
        self.entry_amount.grid(row=6, column=0, padx=20, pady=(0, 14), sticky="ew")

        # 4. Live Macro Preview Card
        self.card_preview = ctk.CTkFrame(
            container,
            fg_color=COLOR_BG_CARD_SECONDARY,
            corner_radius=10,
            border_width=1,
            border_color=COLOR_BORDER
        )
        self.card_preview.grid(row=7, column=0, padx=20, pady=(0, 16), sticky="ew")
        self.card_preview.grid_columnconfigure((0, 1, 2, 3), weight=1)

        ctk.CTkLabel(
            self.card_preview,
            text="PREVIEWED TOTALS",
            font=ctk.CTkFont(family=FONT_FAMILY, size=11, weight="bold"),
            text_color=COLOR_TEXT_MUTED
        ).grid(row=0, column=0, columnspan=4, padx=10, pady=(8, 4), sticky="w")

        self.lbl_prev_cals = ctk.CTkLabel(
            self.card_preview,
            text="0 kcal",
            font=ctk.CTkFont(family=FONT_FAMILY, size=14, weight="bold"),
            text_color=COLOR_CALORIES
        )
        self.lbl_prev_cals.grid(row=1, column=0, padx=4, pady=(0, 8))

        self.lbl_prev_p = ctk.CTkLabel(
            self.card_preview,
            text="0g P",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            text_color=COLOR_PROTEIN
        )
        self.lbl_prev_p.grid(row=1, column=1, padx=4, pady=(0, 8))

        self.lbl_prev_c = ctk.CTkLabel(
            self.card_preview,
            text="0g C",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            text_color=COLOR_CARBS
        )
        self.lbl_prev_c.grid(row=1, column=2, padx=4, pady=(0, 8))

        self.lbl_prev_f = ctk.CTkLabel(
            self.card_preview,
            text="0g F",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            text_color=COLOR_FATS
        )
        self.lbl_prev_f.grid(row=1, column=3, padx=4, pady=(0, 8))

        # Error label
        self.lbl_error = ctk.CTkLabel(
            container,
            text="",
            font=ctk.CTkFont(family=FONT_FAMILY, size=11),
            text_color=COLOR_DANGER
        )
        self.lbl_error.grid(row=8, column=0, padx=20, pady=(0, 4))

        # 5. Buttons
        btn_frame = ctk.CTkFrame(container, fg_color="transparent")
        btn_frame.grid(row=9, column=0, padx=20, pady=(4, 18), sticky="ew")
        btn_frame.grid_columnconfigure((0, 1), weight=1)

        btn_cancel = ctk.CTkButton(
            btn_frame,
            text="Cancel",
            fg_color=COLOR_BG_CARD_SECONDARY,
            hover_color=COLOR_BORDER_LIGHT,
            text_color=COLOR_TEXT_PRIMARY,
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self.destroy
        )
        btn_cancel.grid(row=0, column=0, padx=(0, 6), sticky="ew")

        btn_submit = ctk.CTkButton(
            btn_frame,
            text="✓ Add to Meal",
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            font=ctk.CTkFont(family=FONT_FAMILY, weight="bold"),
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self._on_submit
        )
        btn_submit.grid(row=0, column=1, padx=(6, 0), sticky="ew")

        # Initial unit adjustment
        self._on_food_changed(self.var_food.get())

    def _on_food_changed(self, choice: str) -> None:
        for f in self.foods:
            if f.name == choice:
                self.selected_food = f
                break
        
        if self.selected_food:
            if self.selected_food.unit_type == "100g":
                self.lbl_amount.configure(text="Portion Amount (grams):")
                if not self.var_amount.get() or float(self.var_amount.get() or 0) <= 2:
                    self.var_amount.set("100")
            else:
                desc = f" ({self.selected_food.serving_desc})" if self.selected_food.serving_desc else ""
                self.lbl_amount.configure(text=f"Number of Servings{desc}:")
                if not self.var_amount.get() or float(self.var_amount.get() or 0) > 10:
                    self.var_amount.set("1.0")

        self._update_preview()

    def _update_preview(self) -> None:
        if not self.selected_food:
            return

        try:
            val = float(self.var_amount.get())
            if val <= 0:
                raise ValueError()
            self.lbl_error.configure(text="")
            macros = self.selected_food.calculate_for(val)
            self.lbl_prev_cals.configure(text=f"{int(round(macros['calories']))} kcal")
            self.lbl_prev_p.configure(text=f"{macros['protein']:.1f}g P")
            self.lbl_prev_c.configure(text=f"{macros['carbs']:.1f}g C")
            self.lbl_prev_f.configure(text=f"{macros['fat']:.1f}g F")
        except ValueError:
            self.lbl_prev_cals.configure(text="-- kcal")
            self.lbl_prev_p.configure(text="-- P")
            self.lbl_prev_c.configure(text="-- C")
            self.lbl_prev_f.configure(text="-- F")

    def _on_submit(self) -> None:
        if not self.selected_food:
            self.lbl_error.configure(text="Please select a food item.")
            return

        try:
            amount = float(self.var_amount.get())
            if amount <= 0:
                self.lbl_error.configure(text="Portion must be greater than 0.")
                return
        except ValueError:
            self.lbl_error.configure(text="Please enter a valid numeric portion.")
            return

        macros = self.selected_food.calculate_for(amount)
        unit_lbl = "g" if self.selected_food.unit_type == "100g" else "serving(s)"

        meal = LoggedMeal.create(
            name=self.selected_food.name,
            meal_type=self.var_meal_type.get(),
            quantity=amount,
            unit_label=unit_lbl,
            calories=macros["calories"],
            protein=macros["protein"],
            carbs=macros["carbs"],
            fat=macros["fat"],
            food_id=self.selected_food.id
        )

        self.on_add(meal)
        self.destroy()


class ManualAddDialog(ctk.CTkToplevel):
    """
    Direct manual entry for one-off meals or custom items without saving to library.
    """

    def __init__(
        self,
        master,
        default_meal_type: str,
        on_add: Callable[[LoggedMeal], None]
    ):
        super().__init__(master)
        self.default_meal_type = default_meal_type
        self.on_add = on_add

        self.title("Manual Food Entry")
        self.geometry("460x520")
        self.resizable(False, False)
        self.configure(fg_color=COLOR_BG_ROOT)

        self.transient(master)
        self.grab_set()

        self._build_ui()

    def _build_ui(self) -> None:
        self.grid_columnconfigure(0, weight=1)

        container = ctk.CTkFrame(
            self,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER
        )
        container.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        container.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            container,
            text="✏️ Manual Food Entry",
            font=ctk.CTkFont(family=FONT_FAMILY, size=18, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        ).grid(row=0, column=0, padx=20, pady=(18, 12), sticky="w")

        # Name
        ctk.CTkLabel(
            container,
            text="Food / Meal Name:",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY
        ).grid(row=1, column=0, padx=20, pady=(4, 2), sticky="w")

        self.entry_name = ctk.CTkEntry(
            container,
            placeholder_text="e.g. Protein Bar, Shawarma, etc.",
            fg_color=COLOR_BG_INPUT,
            border_color=COLOR_BORDER
        )
        self.entry_name.grid(row=2, column=0, padx=20, pady=(0, 10), sticky="ew")

        # Meal Category
        ctk.CTkLabel(
            container,
            text="Meal Time:",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY
        ).grid(row=3, column=0, padx=20, pady=(4, 2), sticky="w")

        meal_types = ["Breakfast", "Lunch", "Dinner", "Snacks/Shakes"]
        initial_mt = self.default_meal_type if self.default_meal_type in meal_types else "Lunch"
        self.var_meal_type = ctk.StringVar(value=initial_mt)
        self.seg_meal = ctk.CTkSegmentedButton(
            container,
            values=meal_types,
            variable=self.var_meal_type,
            selected_color=COLOR_ACCENT_PRIMARY,
            unselected_color=COLOR_BG_INPUT
        )
        self.seg_meal.grid(row=4, column=0, padx=20, pady=(0, 12), sticky="ew")

        # Macro Grid: Calories, Protein, Carbs, Fat
        grid_frame = ctk.CTkFrame(container, fg_color="transparent")
        grid_frame.grid(row=5, column=0, padx=20, pady=(0, 10), sticky="ew")
        grid_frame.grid_columnconfigure((0, 1), weight=1)

        # Calories
        ctk.CTkLabel(grid_frame, text="Calories (kcal):", text_color=COLOR_CALORIES, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=0, sticky="w", padx=4)
        self.entry_cals = ctk.CTkEntry(grid_frame, placeholder_text="e.g. 450", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_cals.grid(row=1, column=0, sticky="ew", padx=4, pady=(2, 8))

        # Protein
        ctk.CTkLabel(grid_frame, text="Protein (g):", text_color=COLOR_PROTEIN, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=1, sticky="w", padx=4)
        self.entry_p = ctk.CTkEntry(grid_frame, placeholder_text="e.g. 30", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_p.grid(row=1, column=1, sticky="ew", padx=4, pady=(2, 8))

        # Carbs
        ctk.CTkLabel(grid_frame, text="Carbohydrates (g):", text_color=COLOR_CARBS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=0, sticky="w", padx=4)
        self.entry_c = ctk.CTkEntry(grid_frame, placeholder_text="e.g. 50", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_c.grid(row=3, column=0, sticky="ew", padx=4, pady=(2, 8))

        # Fat
        ctk.CTkLabel(grid_frame, text="Fats (g):", text_color=COLOR_FATS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=1, sticky="w", padx=4)
        self.entry_f = ctk.CTkEntry(grid_frame, placeholder_text="e.g. 15", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_f.grid(row=3, column=1, sticky="ew", padx=4, pady=(2, 8))

        # Error text
        self.lbl_error = ctk.CTkLabel(container, text="", font=ctk.CTkFont(size=11), text_color=COLOR_DANGER)
        self.lbl_error.grid(row=6, column=0, padx=20, pady=(0, 4))

        # Buttons
        btn_frame = ctk.CTkFrame(container, fg_color="transparent")
        btn_frame.grid(row=7, column=0, padx=20, pady=(4, 18), sticky="ew")
        btn_frame.grid_columnconfigure((0, 1), weight=1)

        btn_cancel = ctk.CTkButton(
            btn_frame,
            text="Cancel",
            fg_color=COLOR_BG_CARD_SECONDARY,
            hover_color=COLOR_BORDER_LIGHT,
            text_color=COLOR_TEXT_PRIMARY,
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self.destroy
        )
        btn_cancel.grid(row=0, column=0, padx=(0, 6), sticky="ew")

        btn_submit = ctk.CTkButton(
            btn_frame,
            text="✓ Log Entry",
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            font=ctk.CTkFont(weight="bold"),
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self._on_submit
        )
        btn_submit.grid(row=0, column=1, padx=(6, 0), sticky="ew")

    def _on_submit(self) -> None:
        name = self.entry_name.get().strip()
        if not name:
            self.lbl_error.configure(text="Please provide a food name.")
            return

        try:
            cals = float(self.entry_cals.get() or 0.0)
            p = float(self.entry_p.get() or 0.0)
            c = float(self.entry_c.get() or 0.0)
            f = float(self.entry_f.get() or 0.0)
            if cals < 0 or p < 0 or c < 0 or f < 0:
                raise ValueError()
        except ValueError:
            self.lbl_error.configure(text="Please enter positive numeric macros.")
            return

        meal = LoggedMeal.create(
            name=name,
            meal_type=self.var_meal_type.get(),
            quantity=1.0,
            unit_label="serving",
            calories=cals,
            protein=p,
            carbs=c,
            fat=f
        )
        self.on_add(meal)
        self.destroy()


class EditMealDialog(ctk.CTkToplevel):
    """Allows user to edit an already logged meal."""

    def __init__(self, master, meal: LoggedMeal, on_save: Callable[[LoggedMeal], None]):
        super().__init__(master)
        self.meal = meal
        self.on_save = on_save

        self.title("Edit Logged Meal")
        self.geometry("440x480")
        self.resizable(False, False)
        self.configure(fg_color=COLOR_BG_ROOT)

        self.transient(master)
        self.grab_set()

        self._build_ui()

    def _build_ui(self) -> None:
        self.grid_columnconfigure(0, weight=1)

        container = ctk.CTkFrame(
            self,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER
        )
        container.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        container.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            container,
            text=f"Edit: {self.meal.name}",
            font=ctk.CTkFont(family=FONT_FAMILY, size=16, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        ).grid(row=0, column=0, padx=20, pady=(16, 10), sticky="w")

        # Category
        meal_types = ["Breakfast", "Lunch", "Dinner", "Snacks/Shakes"]
        self.var_meal_type = ctk.StringVar(value=self.meal.meal_type)
        self.seg_meal = ctk.CTkSegmentedButton(
            container,
            values=meal_types,
            variable=self.var_meal_type,
            selected_color=COLOR_ACCENT_PRIMARY,
            unselected_color=COLOR_BG_INPUT
        )
        self.seg_meal.grid(row=1, column=0, padx=20, pady=(0, 12), sticky="ew")

        # Macros
        grid_frame = ctk.CTkFrame(container, fg_color="transparent")
        grid_frame.grid(row=2, column=0, padx=20, pady=6, sticky="ew")
        grid_frame.grid_columnconfigure((0, 1), weight=1)

        ctk.CTkLabel(grid_frame, text="Calories (kcal):", text_color=COLOR_CALORIES, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=0, sticky="w", padx=4)
        self.entry_cals = ctk.CTkEntry(grid_frame, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_cals.insert(0, str(int(round(self.meal.calories))))
        self.entry_cals.grid(row=1, column=0, sticky="ew", padx=4, pady=(2, 8))

        ctk.CTkLabel(grid_frame, text="Protein (g):", text_color=COLOR_PROTEIN, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=1, sticky="w", padx=4)
        self.entry_p = ctk.CTkEntry(grid_frame, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_p.insert(0, str(self.meal.protein))
        self.entry_p.grid(row=1, column=1, sticky="ew", padx=4, pady=(2, 8))

        ctk.CTkLabel(grid_frame, text="Carbs (g):", text_color=COLOR_CARBS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=0, sticky="w", padx=4)
        self.entry_c = ctk.CTkEntry(grid_frame, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_c.insert(0, str(self.meal.carbs))
        self.entry_c.grid(row=3, column=0, sticky="ew", padx=4, pady=(2, 8))

        ctk.CTkLabel(grid_frame, text="Fats (g):", text_color=COLOR_FATS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=1, sticky="w", padx=4)
        self.entry_f = ctk.CTkEntry(grid_frame, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_f.insert(0, str(self.meal.fat))
        self.entry_f.grid(row=3, column=1, sticky="ew", padx=4, pady=(2, 8))

        # Quantity
        ctk.CTkLabel(container, text=f"Portion Amount ({self.meal.unit_label}):", font=ctk.CTkFont(size=12, weight="bold"), text_color=COLOR_TEXT_SECONDARY).grid(row=3, column=0, padx=20, pady=(4, 2), sticky="w")
        self.entry_qty = ctk.CTkEntry(container, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_qty.insert(0, str(self.meal.quantity))
        self.entry_qty.grid(row=4, column=0, padx=20, pady=(0, 10), sticky="ew")

        self.lbl_error = ctk.CTkLabel(container, text="", font=ctk.CTkFont(size=11), text_color=COLOR_DANGER)
        self.lbl_error.grid(row=5, column=0, padx=20, pady=(0, 4))

        # Buttons
        btn_frame = ctk.CTkFrame(container, fg_color="transparent")
        btn_frame.grid(row=6, column=0, padx=20, pady=(4, 16), sticky="ew")
        btn_frame.grid_columnconfigure((0, 1), weight=1)

        btn_cancel = ctk.CTkButton(
            btn_frame,
            text="Cancel",
            fg_color=COLOR_BG_CARD_SECONDARY,
            hover_color=COLOR_BORDER_LIGHT,
            text_color=COLOR_TEXT_PRIMARY,
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self.destroy
        )
        btn_cancel.grid(row=0, column=0, padx=(0, 6), sticky="ew")

        btn_save = ctk.CTkButton(
            btn_frame,
            text="Save Changes",
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            font=ctk.CTkFont(weight="bold"),
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self._on_save
        )
        btn_save.grid(row=0, column=1, padx=(6, 0), sticky="ew")

    def _on_save(self) -> None:
        try:
            cals = float(self.entry_cals.get())
            p = float(self.entry_p.get())
            c = float(self.entry_c.get())
            f = float(self.entry_f.get())
            qty = float(self.entry_qty.get())
            if cals < 0 or p < 0 or c < 0 or f < 0 or qty <= 0:
                raise ValueError()
        except ValueError:
            self.lbl_error.configure(text="Please verify all numbers are positive.")
            return

        updated = LoggedMeal.create(
            name=self.meal.name,
            meal_type=self.var_meal_type.get(),
            quantity=qty,
            unit_label=self.meal.unit_label,
            calories=cals,
            protein=p,
            carbs=c,
            fat=f,
            food_id=self.meal.food_id,
            meal_id=self.meal.id
        )
        self.on_save(updated)
        self.destroy()


class FoodEditorDialog(ctk.CTkToplevel):
    """Create or edit an item in the 'My Foods & Meals' library."""

    def __init__(
        self,
        master,
        food: Optional[FoodItem] = None,
        on_save: Optional[Callable[[FoodItem], None]] = None
    ):
        super().__init__(master)
        self.food = food
        self.on_save = on_save

        is_edit = food is not None
        self.title("Edit Food Item" if is_edit else "Add New Food / Preset")
        self.geometry("460x540")
        self.resizable(False, False)
        self.configure(fg_color=COLOR_BG_ROOT)

        self.transient(master)
        self.grab_set()

        self._build_ui()

    def _build_ui(self) -> None:
        self.grid_columnconfigure(0, weight=1)

        container = ctk.CTkFrame(
            self,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER
        )
        container.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        container.grid_columnconfigure(0, weight=1)

        title_text = "Edit Food Preset" if self.food else "➕ Add Food Preset"
        ctk.CTkLabel(
            container,
            text=title_text,
            font=ctk.CTkFont(family=FONT_FAMILY, size=18, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        ).grid(row=0, column=0, padx=20, pady=(16, 10), sticky="w")

        # Name
        ctk.CTkLabel(container, text="Food Name:", font=ctk.CTkFont(size=12, weight="bold"), text_color=COLOR_TEXT_SECONDARY).grid(row=1, column=0, padx=20, pady=(4, 2), sticky="w")
        self.entry_name = ctk.CTkEntry(container, placeholder_text="e.g. Oatmeal with Whey", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        if self.food:
            self.entry_name.insert(0, self.food.name)
        self.entry_name.grid(row=2, column=0, padx=20, pady=(0, 10), sticky="ew")

        # Unit type: 100g vs 1 serving
        ctk.CTkLabel(container, text="Measurement Standard:", font=ctk.CTkFont(size=12, weight="bold"), text_color=COLOR_TEXT_SECONDARY).grid(row=3, column=0, padx=20, pady=(4, 2), sticky="w")
        unit_val = "100g" if (not self.food or self.food.unit_type == "100g") else "serving"
        self.var_unit = ctk.StringVar(value=unit_val)
        self.seg_unit = ctk.CTkSegmentedButton(
            container,
            values=["100g", "serving"],
            variable=self.var_unit,
            selected_color=COLOR_ACCENT_PRIMARY,
            unselected_color=COLOR_BG_INPUT
        )
        self.seg_unit.grid(row=4, column=0, padx=20, pady=(0, 10), sticky="ew")

        # Serving Description
        ctk.CTkLabel(container, text="Serving Note (optional):", font=ctk.CTkFont(size=12, weight="bold"), text_color=COLOR_TEXT_SECONDARY).grid(row=5, column=0, padx=20, pady=(4, 2), sticky="w")
        self.entry_desc = ctk.CTkEntry(container, placeholder_text="e.g. raw weight, 1 container, cooked", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        if self.food and self.food.serving_desc:
            self.entry_desc.insert(0, self.food.serving_desc)
        self.entry_desc.grid(row=6, column=0, padx=20, pady=(0, 10), sticky="ew")

        # Macros Grid
        grid_frame = ctk.CTkFrame(container, fg_color="transparent")
        grid_frame.grid(row=7, column=0, padx=20, pady=4, sticky="ew")
        grid_frame.grid_columnconfigure((0, 1), weight=1)

        ctk.CTkLabel(grid_frame, text="Calories (kcal):", text_color=COLOR_CALORIES, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=0, sticky="w", padx=4)
        self.entry_cals = ctk.CTkEntry(grid_frame, placeholder_text="0", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        if self.food:
            self.entry_cals.insert(0, str(self.food.calories))
        self.entry_cals.grid(row=1, column=0, sticky="ew", padx=4, pady=(2, 6))

        ctk.CTkLabel(grid_frame, text="Protein (g):", text_color=COLOR_PROTEIN, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=1, sticky="w", padx=4)
        self.entry_p = ctk.CTkEntry(grid_frame, placeholder_text="0", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        if self.food:
            self.entry_p.insert(0, str(self.food.protein))
        self.entry_p.grid(row=1, column=1, sticky="ew", padx=4, pady=(2, 6))

        ctk.CTkLabel(grid_frame, text="Carbs (g):", text_color=COLOR_CARBS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=0, sticky="w", padx=4)
        self.entry_c = ctk.CTkEntry(grid_frame, placeholder_text="0", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        if self.food:
            self.entry_c.insert(0, str(self.food.carbs))
        self.entry_c.grid(row=3, column=0, sticky="ew", padx=4, pady=(2, 6))

        ctk.CTkLabel(grid_frame, text="Fats (g):", text_color=COLOR_FATS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=1, sticky="w", padx=4)
        self.entry_f = ctk.CTkEntry(grid_frame, placeholder_text="0", fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        if self.food:
            self.entry_f.insert(0, str(self.food.fat))
        self.entry_f.grid(row=3, column=1, sticky="ew", padx=4, pady=(2, 6))

        self.lbl_error = ctk.CTkLabel(container, text="", font=ctk.CTkFont(size=11), text_color=COLOR_DANGER)
        self.lbl_error.grid(row=8, column=0, padx=20, pady=(0, 4))

        # Buttons
        btn_frame = ctk.CTkFrame(container, fg_color="transparent")
        btn_frame.grid(row=9, column=0, padx=20, pady=(4, 16), sticky="ew")
        btn_frame.grid_columnconfigure((0, 1), weight=1)

        btn_cancel = ctk.CTkButton(
            btn_frame,
            text="Cancel",
            fg_color=COLOR_BG_CARD_SECONDARY,
            hover_color=COLOR_BORDER_LIGHT,
            text_color=COLOR_TEXT_PRIMARY,
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self.destroy
        )
        btn_cancel.grid(row=0, column=0, padx=(0, 6), sticky="ew")

        btn_save = ctk.CTkButton(
            btn_frame,
            text="✓ Save Preset",
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            text_color=COLOR_TEXT_PRIMARY,
            font=ctk.CTkFont(weight="bold"),
            corner_radius=CORNER_RADIUS_BUTTON,
            command=self._on_save
        )
        btn_save.grid(row=0, column=1, padx=(6, 0), sticky="ew")

    def _on_save(self) -> None:
        name = self.entry_name.get().strip()
        if not name:
            self.lbl_error.configure(text="Please enter a name for the food.")
            return

        try:
            cals = float(self.entry_cals.get() or 0)
            p = float(self.entry_p.get() or 0)
            c = float(self.entry_c.get() or 0)
            f = float(self.entry_f.get() or 0)
            if cals < 0 or p < 0 or c < 0 or f < 0:
                raise ValueError()
        except ValueError:
            self.lbl_error.configure(text="Macros must be valid positive numbers.")
            return

        item_id = self.food.id if self.food else None
        is_staple = self.food.is_staple if self.food else False

        saved_item = FoodItem.create(
            name=name,
            unit_type=self.var_unit.get(),
            calories=cals,
            protein=p,
            carbs=c,
            fat=f,
            serving_desc=self.entry_desc.get().strip(),
            is_staple=is_staple,
            item_id=item_id
        )

        if self.on_save:
            self.on_save(saved_item)
        self.destroy()
