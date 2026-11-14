"""
Goals & Body Weight View: Mifflin-St Jeor Lean Bulking Calculator, Target Macros, and Weight Tracker.
"""

import customtkinter as ctk
from datetime import datetime
from typing import Callable, Optional, List

from theme import (
    COLOR_BG_ROOT, COLOR_BG_CARD, COLOR_BG_CARD_SECONDARY, COLOR_BG_CARD_HOVER,
    COLOR_BORDER, COLOR_BORDER_LIGHT, COLOR_BG_INPUT,
    COLOR_TEXT_PRIMARY, COLOR_TEXT_SECONDARY, COLOR_TEXT_MUTED,
    COLOR_CALORIES, COLOR_PROTEIN, COLOR_CARBS, COLOR_FATS,
    COLOR_ACCENT_PRIMARY, COLOR_ACCENT_HOVER, COLOR_SUCCESS,
    CORNER_RADIUS_CARD, CORNER_RADIUS_BUTTON, CORNER_RADIUS_INPUT, FONT_FAMILY
)
from models import UserSettings, WeightEntry
from database import Database


class GoalsView(ctk.CTkFrame):
    """
    Manages body weight tracking towards goal and lean bulking target calculations.
    """

    def __init__(self, master, db: Database, on_data_changed: Callable[[], None], **kwargs):
        super().__init__(master, fg_color=COLOR_BG_ROOT, **kwargs)
        self.db = db
        self.on_data_changed = on_data_changed

        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)

        self._build_header()
        self._build_content()
        self.refresh()

    def _build_header(self) -> None:
        header_container = ctk.CTkFrame(self, fg_color="transparent")
        header_container.grid(row=0, column=0, sticky="ew", padx=24, pady=(20, 10))

        ctk.CTkLabel(
            header_container,
            text="🎯 Lean Bulking Goals & Weight Tracker",
            font=ctk.CTkFont(family=FONT_FAMILY, size=20, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        ).grid(row=0, column=0, sticky="w")

        ctk.CTkLabel(
            header_container,
            text="Configure your daily nutritional targets and monitor morning scale weight progress.",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13),
            text_color=COLOR_TEXT_MUTED
        ).grid(row=1, column=0, sticky="w", pady=(2, 0))

    def _build_content(self) -> None:
        self.scroll_area = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll_area.grid(row=1, column=0, sticky="nsew", padx=24, pady=(0, 16))
        self.scroll_area.grid_columnconfigure((0, 1), weight=1)

        # Left Column: Weight Tracker Card
        self._build_weight_column()

        # Right Column: Lean Bulking Targets & Calculator Card
        self._build_calculator_column()

    def _build_weight_column(self) -> None:
        col = ctk.CTkFrame(
            self.scroll_area,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER
        )
        col.grid(row=0, column=0, sticky="nsew", padx=(0, 10), pady=4)
        col.grid_columnconfigure(0, weight=1)

        # Card Title
        ctk.CTkLabel(
            col,
            text="⚖️ Body Weight Transformation",
            font=ctk.CTkFont(family=FONT_FAMILY, size=16, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        ).grid(row=0, column=0, padx=16, pady=(16, 6), sticky="w")

        # Visual Transformation Progress Card
        self.progress_box = ctk.CTkFrame(col, fg_color=COLOR_BG_CARD_SECONDARY, corner_radius=10)
        self.progress_box.grid(row=1, column=0, sticky="ew", padx=16, pady=6)
        self.progress_box.grid_columnconfigure(1, weight=1)

        self.lbl_curr_wt = ctk.CTkLabel(
            self.progress_box,
            text="Current: 63.2 kg",
            font=ctk.CTkFont(family=FONT_FAMILY, size=14, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        self.lbl_curr_wt.grid(row=0, column=0, padx=12, pady=(10, 4), sticky="w")

        self.lbl_goal_wt = ctk.CTkLabel(
            self.progress_box,
            text="Goal: 70.0 kg",
            font=ctk.CTkFont(family=FONT_FAMILY, size=14, weight="bold"),
            text_color="#10b981"
        )
        self.lbl_goal_wt.grid(row=0, column=2, padx=12, pady=(10, 4), sticky="e")

        self.bar_weight = ctk.CTkProgressBar(
            self.progress_box,
            height=10,
            corner_radius=5,
            progress_color="#10b981",
            fg_color="#262a36"
        )
        self.bar_weight.grid(row=1, column=0, columnspan=3, sticky="ew", padx=12, pady=4)

        self.lbl_weight_rem = ctk.CTkLabel(
            self.progress_box,
            text="+6.8 kg to target",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12),
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_weight_rem.grid(row=2, column=0, columnspan=3, padx=12, pady=(2, 10))

        # Log Morning Weight Form
        ctk.CTkLabel(
            col,
            text="Log Morning Weigh-in:",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY
        ).grid(row=2, column=0, padx=16, pady=(12, 4), sticky="w")

        log_form = ctk.CTkFrame(col, fg_color="transparent")
        log_form.grid(row=3, column=0, sticky="ew", padx=16, pady=(0, 8))
        log_form.grid_columnconfigure(0, weight=1)

        self.entry_morning_wt = ctk.CTkEntry(
            log_form,
            placeholder_text="e.g. 63.5",
            fg_color=COLOR_BG_INPUT,
            border_color=COLOR_BORDER,
            font=ctk.CTkFont(size=14)
        )
        self.entry_morning_wt.grid(row=0, column=0, sticky="ew", padx=(0, 8))

        btn_log_wt = ctk.CTkButton(
            log_form,
            text="Record",
            width=80,
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            corner_radius=CORNER_RADIUS_BUTTON,
            font=ctk.CTkFont(weight="bold"),
            command=self._on_log_weight
        )
        btn_log_wt.grid(row=0, column=1, sticky="e")

        self.lbl_wt_feedback = ctk.CTkLabel(col, text="", font=ctk.CTkFont(size=11), text_color=COLOR_SUCCESS)
        self.lbl_wt_feedback.grid(row=4, column=0, padx=16, pady=(0, 6))

        # Recent Weight History List
        ctk.CTkLabel(
            col,
            text="Recent Weigh-in Logs:",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            text_color=COLOR_TEXT_SECONDARY
        ).grid(row=5, column=0, padx=16, pady=(6, 4), sticky="w")

        self.weights_container = ctk.CTkFrame(col, fg_color="transparent")
        self.weights_container.grid(row=6, column=0, sticky="ew", padx=16, pady=(0, 16))
        self.weights_container.grid_columnconfigure(0, weight=1)

    def _build_calculator_column(self) -> None:
        col = ctk.CTkFrame(
            self.scroll_area,
            fg_color=COLOR_BG_CARD,
            corner_radius=CORNER_RADIUS_CARD,
            border_width=1,
            border_color=COLOR_BORDER
        )
        col.grid(row=0, column=1, sticky="nsew", padx=(10, 0), pady=4)
        col.grid_columnconfigure(0, weight=1)

        ctk.CTkLabel(
            col,
            text="🔥 Nutrition Targets & Calculator",
            font=ctk.CTkFont(family=FONT_FAMILY, size=16, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        ).grid(row=0, column=0, padx=16, pady=(16, 6), sticky="w")

        # Mode Selection
        self.var_mode = ctk.StringVar(value="Manual Targets")
        self.seg_mode = ctk.CTkSegmentedButton(
            col,
            values=["Manual Targets", "Mifflin-St Jeor Auto"],
            variable=self.var_mode,
            selected_color=COLOR_ACCENT_PRIMARY,
            unselected_color=COLOR_BG_INPUT,
            command=self._on_mode_toggled
        )
        self.seg_mode.grid(row=1, column=0, padx=16, pady=(4, 12), sticky="ew")

        # Container for Targets Inputs
        self.inputs_box = ctk.CTkFrame(col, fg_color="transparent")
        self.inputs_box.grid(row=2, column=0, sticky="ew", padx=16, pady=0)
        self.inputs_box.grid_columnconfigure((0, 1), weight=1)

        # --- Manual Target Inputs ---
        ctk.CTkLabel(self.inputs_box, text="Daily Calories (kcal):", text_color=COLOR_CALORIES, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=0, sticky="w", padx=4)
        self.entry_tgt_cals = ctk.CTkEntry(self.inputs_box, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_tgt_cals.grid(row=1, column=0, sticky="ew", padx=4, pady=(2, 8))

        ctk.CTkLabel(self.inputs_box, text="Protein (g):", text_color=COLOR_PROTEIN, font=ctk.CTkFont(size=12, weight="bold")).grid(row=0, column=1, sticky="w", padx=4)
        self.entry_tgt_p = ctk.CTkEntry(self.inputs_box, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_tgt_p.grid(row=1, column=1, sticky="ew", padx=4, pady=(2, 8))

        ctk.CTkLabel(self.inputs_box, text="Carbohydrates (g):", text_color=COLOR_CARBS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=0, sticky="w", padx=4)
        self.entry_tgt_c = ctk.CTkEntry(self.inputs_box, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_tgt_c.grid(row=3, column=0, sticky="ew", padx=4, pady=(2, 8))

        ctk.CTkLabel(self.inputs_box, text="Fats (g):", text_color=COLOR_FATS, font=ctk.CTkFont(size=12, weight="bold")).grid(row=2, column=1, sticky="w", padx=4)
        self.entry_tgt_f = ctk.CTkEntry(self.inputs_box, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_tgt_f.grid(row=3, column=1, sticky="ew", padx=4, pady=(2, 8))

        # --- Profile & BMR Fields ---
        ctk.CTkLabel(col, text="Body Stats & Metabolic Settings:", font=ctk.CTkFont(size=13, weight="bold"), text_color=COLOR_TEXT_SECONDARY).grid(row=3, column=0, padx=16, pady=(8, 4), sticky="w")

        stats_grid = ctk.CTkFrame(col, fg_color="transparent")
        stats_grid.grid(row=4, column=0, sticky="ew", padx=16, pady=0)
        stats_grid.grid_columnconfigure((0, 1, 2), weight=1)

        # Height
        ctk.CTkLabel(stats_grid, text="Height (cm):", font=ctk.CTkFont(size=11), text_color=COLOR_TEXT_MUTED).grid(row=0, column=0, sticky="w")
        self.entry_height = ctk.CTkEntry(stats_grid, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_height.grid(row=1, column=0, sticky="ew", padx=(0, 4), pady=(2, 8))

        # Age
        ctk.CTkLabel(stats_grid, text="Age:", font=ctk.CTkFont(size=11), text_color=COLOR_TEXT_MUTED).grid(row=0, column=1, sticky="w")
        self.entry_age = ctk.CTkEntry(stats_grid, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_age.grid(row=1, column=1, sticky="ew", padx=2, pady=(2, 8))

        # Goal Weight
        ctk.CTkLabel(stats_grid, text="Goal Wt (kg):", font=ctk.CTkFont(size=11), text_color=COLOR_TEXT_MUTED).grid(row=0, column=2, sticky="w")
        self.entry_goal_wt = ctk.CTkEntry(stats_grid, fg_color=COLOR_BG_INPUT, border_color=COLOR_BORDER)
        self.entry_goal_wt.grid(row=1, column=2, sticky="ew", padx=(4, 0), pady=(2, 8))

        # Activity level
        ctk.CTkLabel(col, text="Weekly Activity:", font=ctk.CTkFont(size=11), text_color=COLOR_TEXT_MUTED).grid(row=5, column=0, padx=16, pady=(0, 2), sticky="w")
        activity_options = [
            "Moderate (4x/week strength training)",
            "Heavy (6-7x/week intense training)",
            "Light (1-3x/week light exercise)",
            "Sedentary (desk job, little exercise)"
        ]
        self.var_activity = ctk.StringVar(value=activity_options[0])
        self.combo_activity = ctk.CTkComboBox(
            col,
            values=activity_options,
            variable=self.var_activity,
            fg_color=COLOR_BG_INPUT,
            border_color=COLOR_BORDER
        )
        self.combo_activity.grid(row=6, column=0, padx=16, pady=(0, 8), sticky="ew")

        # Calorie Surplus Slider / Indicator
        ctk.CTkLabel(col, text="Lean Bulking Surplus (+kcal/day):", font=ctk.CTkFont(size=11), text_color=COLOR_TEXT_MUTED).grid(row=7, column=0, padx=16, pady=(0, 2), sticky="w")
        surplus_row = ctk.CTkFrame(col, fg_color="transparent")
        surplus_row.grid(row=8, column=0, sticky="ew", padx=16, pady=(0, 10))
        surplus_row.grid_columnconfigure(0, weight=1)

        self.slider_surplus = ctk.CTkSlider(
            surplus_row,
            from_=200,
            to=600,
            number_of_steps=8,
            progress_color=COLOR_ACCENT_PRIMARY,
            command=self._on_surplus_slider
        )
        self.slider_surplus.grid(row=0, column=0, sticky="ew", padx=(0, 8))

        self.lbl_surplus_val = ctk.CTkLabel(
            surplus_row,
            text="+350 kcal",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            text_color="#f59e0b",
            width=70
        )
        self.lbl_surplus_val.grid(row=0, column=1, sticky="e")

        # Save Button
        btn_save = ctk.CTkButton(
            col,
            text="💾 Save Settings & Goals",
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            fg_color=COLOR_ACCENT_PRIMARY,
            hover_color=COLOR_ACCENT_HOVER,
            corner_radius=CORNER_RADIUS_BUTTON,
            height=36,
            command=self._on_save_settings
        )
        btn_save.grid(row=9, column=0, padx=16, pady=(6, 16), sticky="ew")

    def _on_mode_toggled(self, choice: str) -> None:
        is_manual = choice == "Manual Targets"
        state = "normal" if is_manual else "disabled"
        self.entry_tgt_cals.configure(state=state)
        self.entry_tgt_p.configure(state=state)
        self.entry_tgt_c.configure(state=state)
        self.entry_tgt_f.configure(state=state)

    def _on_surplus_slider(self, val: float) -> None:
        int_val = int(round(val / 50.0) * 50)
        self.lbl_surplus_val.configure(text=f"+{int_val} kcal")

    def _on_log_weight(self) -> None:
        val_str = self.entry_morning_wt.get().strip()
        try:
            wt = float(val_str)
            if wt < 30 or wt > 250:
                raise ValueError()
        except ValueError:
            self.lbl_wt_feedback.configure(text="Please enter a valid weight (e.g. 63.5)", text_color="#f43f5e")
            return

        today_str = datetime.now().strftime("%Y-%m-%d")
        self.db.log_weight(today_str, wt)
        self.lbl_wt_feedback.configure(text=f"✓ Recorded {wt:.1f} kg for today!", text_color=COLOR_SUCCESS)
        self.entry_morning_wt.delete(0, "end")
        self.refresh()
        self.on_data_changed()

    def _on_save_settings(self) -> None:
        current_s = self.db.get_settings()
        try:
            h = float(self.entry_height.get())
            a = int(self.entry_age.get())
            gw = float(self.entry_goal_wt.get())
            surplus = int(self.slider_surplus.get())
            is_manual = self.var_mode.get() == "Manual Targets"

            if is_manual:
                cals = float(self.entry_tgt_cals.get())
                p = float(self.entry_tgt_p.get())
                c = float(self.entry_tgt_c.get())
                f = float(self.entry_tgt_f.get())
            else:
                cals = current_s.target_calories
                p = current_s.target_protein
                c = current_s.target_carbs
                f = current_s.target_fat

            new_settings = UserSettings(
                weight_kg=current_s.weight_kg,
                goal_weight_kg=gw,
                height_cm=h,
                age=a,
                gender=current_s.gender,
                activity_level=self.var_activity.get(),
                surplus_kcal=surplus,
                use_manual_targets=is_manual,
                target_calories=cals,
                target_protein=p,
                target_carbs=c,
                target_fat=f
            )
            self.db.update_settings(new_settings)
            self.lbl_wt_feedback.configure(text="✓ Saved bulking targets & goals!", text_color=COLOR_SUCCESS)
            self.refresh()
            self.on_data_changed()
        except ValueError as err:
            self.lbl_wt_feedback.configure(text="Please ensure numeric inputs are valid.", text_color="#f43f5e")

    def refresh(self) -> None:
        """Populates form controls with current persisted database values."""
        settings = self.db.get_settings()

        # Update weight cards
        self.lbl_curr_wt.configure(text=f"Current: {settings.weight_kg:.1f} kg")
        self.lbl_goal_wt.configure(text=f"Goal: {settings.goal_weight_kg:.1f} kg")

        total_needed = max(0.1, settings.goal_weight_kg - 55.0)  # baseline reference
        current_progress = max(0.0, min(1.0, (settings.weight_kg - 55.0) / total_needed))
        self.bar_weight.set(current_progress)

        diff = settings.goal_weight_kg - settings.weight_kg
        if diff > 0:
            self.lbl_weight_rem.configure(text=f"+{diff:.1f} kg to goal ({int(current_progress*100)}% progress)")
        else:
            self.lbl_weight_rem.configure(text=f"🎉 Goal weight of {settings.goal_weight_kg:.1f} kg achieved!", text_color=COLOR_SUCCESS)

        # Populate weight list
        for w in self.weights_container.winfo_children():
            w.destroy()

        weights = self.db.get_all_weights()[-5:]  # last 5 entries
        for idx, entry in enumerate(reversed(weights)):
            row = ctk.CTkFrame(self.weights_container, fg_color=COLOR_BG_CARD_SECONDARY, corner_radius=6)
            row.grid(row=idx, column=0, sticky="ew", pady=2)
            row.grid_columnconfigure(1, weight=1)

            ctk.CTkLabel(row, text=f"📅 {entry.date}", font=ctk.CTkFont(size=12, weight="bold"), text_color=COLOR_TEXT_PRIMARY).grid(row=0, column=0, padx=8, pady=4, sticky="w")
            ctk.CTkLabel(row, text=f"{entry.weight_kg:.1f} kg", font=ctk.CTkFont(size=13, weight="bold"), text_color="#10b981").grid(row=0, column=2, padx=8, pady=4, sticky="e")

        # Populate form entries
        self.entry_height.delete(0, "end")
        self.entry_height.insert(0, str(settings.height_cm))

        self.entry_age.delete(0, "end")
        self.entry_age.insert(0, str(settings.age))

        self.entry_goal_wt.delete(0, "end")
        self.entry_goal_wt.insert(0, str(settings.goal_weight_kg))

        self.var_activity.set(settings.activity_level)
        self.slider_surplus.set(settings.surplus_kcal)
        self.lbl_surplus_val.configure(text=f"+{settings.surplus_kcal} kcal")

        # Mode
        mode_str = "Manual Targets" if settings.use_manual_targets else "Mifflin-St Jeor Auto"
        self.var_mode.set(mode_str)
        self._on_mode_toggled(mode_str)

        # Targets
        eff = settings.get_effective_targets()
        self.entry_tgt_cals.delete(0, "end")
        self.entry_tgt_cals.insert(0, str(int(eff["calories"])))

        self.entry_tgt_p.delete(0, "end")
        self.entry_tgt_p.insert(0, str(eff["protein"]))

        self.entry_tgt_c.delete(0, "end")
        self.entry_tgt_c.insert(0, str(eff["carbs"]))

        self.entry_tgt_f.delete(0, "end")
        self.entry_tgt_f.insert(0, str(eff["fat"]))
