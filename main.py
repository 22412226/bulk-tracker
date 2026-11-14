"""
Lean Bulking & Macro Tracker - Modern macOS Desktop Application.
Built with CustomTkinter and Apple Health inspired aesthetics.
"""

import sys
import customtkinter as ctk

from theme import (
    COLOR_BG_ROOT, COLOR_BG_SIDEBAR, COLOR_BG_CARD, COLOR_BG_CARD_HOVER,
    COLOR_BORDER, COLOR_BORDER_LIGHT,
    COLOR_TEXT_PRIMARY, COLOR_TEXT_SECONDARY, COLOR_TEXT_MUTED,
    COLOR_ACCENT_PRIMARY, COLOR_ACCENT_HOVER,
    CORNER_RADIUS_BUTTON, FONT_FAMILY
)
from database import Database
from view_dashboard import DashboardView
from view_library import LibraryView
from view_goals import GoalsView


class BulkingTrackerApp(ctk.CTk):
    """Main application window with native-feel macOS sidebar navigation."""

    def __init__(self):
        super().__init__()

        # Appearance configuration
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        self.title("Lean Bulking & Macro Tracker")
        self.geometry("1120x760")
        self.minsize(980, 680)
        self.configure(fg_color=COLOR_BG_ROOT)

        # Initialize persistence database
        self.db = Database()

        # Grid configuration: 2 columns (sidebar + content)
        self.grid_columnconfigure(0, weight=0, minsize=220)
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._build_sidebar()
        self._build_views()

        # Default to Dashboard
        self._show_view("dashboard")

    def _build_sidebar(self) -> None:
        """Left navigation sidebar inspired by macOS app layouts."""
        self.sidebar = ctk.CTkFrame(
            self,
            fg_color=COLOR_BG_SIDEBAR,
            corner_radius=0,
            border_width=1,
            border_color=COLOR_BORDER
        )
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(5, weight=1)

        # App Brand Header
        brand_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        brand_frame.grid(row=0, column=0, sticky="ew", padx=18, pady=(24, 20))

        lbl_logo = ctk.CTkLabel(
            brand_frame,
            text="⚡ BULK TRACKER",
            font=ctk.CTkFont(family=FONT_FAMILY, size=18, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        lbl_logo.grid(row=0, column=0, sticky="w")

        lbl_tagline = ctk.CTkLabel(
            brand_frame,
            text="Lean Surplus & Macro Engine",
            font=ctk.CTkFont(family=FONT_FAMILY, size=11),
            text_color=COLOR_TEXT_MUTED
        )
        lbl_tagline.grid(row=1, column=0, sticky="w", pady=(2, 0))

        # Nav Buttons
        self.nav_buttons = {}

        self.nav_buttons["dashboard"] = self._create_nav_button(
            text="📊  Daily Dashboard",
            row=1,
            command=lambda: self._show_view("dashboard")
        )

        self.nav_buttons["library"] = self._create_nav_button(
            text="🥑  Food Library",
            row=2,
            command=lambda: self._show_view("library")
        )

        self.nav_buttons["goals"] = self._create_nav_button(
            text="🎯  Goals & Weight",
            row=3,
            command=lambda: self._show_view("goals")
        )

        # Bottom Mini Status Profile
        bottom_box = ctk.CTkFrame(
            self.sidebar,
            fg_color=COLOR_BG_CARD,
            corner_radius=10,
            border_width=1,
            border_color=COLOR_BORDER
        )
        bottom_box.grid(row=6, column=0, sticky="ew", padx=14, pady=18)
        bottom_box.grid_columnconfigure(0, weight=1)

        self.lbl_side_weight = ctk.CTkLabel(
            bottom_box,
            text="Weight: 63.2 kg",
            font=ctk.CTkFont(family=FONT_FAMILY, size=12, weight="bold"),
            text_color=COLOR_TEXT_PRIMARY
        )
        self.lbl_side_weight.grid(row=0, column=0, padx=10, pady=(10, 2), sticky="w")

        self.lbl_side_target = ctk.CTkLabel(
            bottom_box,
            text="Target: 2,900 kcal/day",
            font=ctk.CTkFont(family=FONT_FAMILY, size=11),
            text_color="#f59e0b"
        )
        self.lbl_side_target.grid(row=1, column=0, padx=10, pady=(0, 10), sticky="w")

    def _create_nav_button(self, text: str, row: int, command) -> ctk.CTkButton:
        btn = ctk.CTkButton(
            self.sidebar,
            text=text,
            height=38,
            corner_radius=CORNER_RADIUS_BUTTON,
            fg_color="transparent",
            hover_color=COLOR_BG_CARD_HOVER,
            text_color=COLOR_TEXT_SECONDARY,
            font=ctk.CTkFont(family=FONT_FAMILY, size=13, weight="bold"),
            anchor="w",
            command=command
        )
        btn.grid(row=row, column=0, sticky="ew", padx=12, pady=3)
        return btn

    def _build_views(self) -> None:
        """Instantiates all primary views inside the container area."""
        self.views = {
            "dashboard": DashboardView(
                self,
                db=self.db,
                on_data_changed=self._on_data_synchronized
            ),
            "library": LibraryView(
                self,
                db=self.db,
                on_data_changed=self._on_data_synchronized
            ),
            "goals": GoalsView(
                self,
                db=self.db,
                on_data_changed=self._on_data_synchronized
            )
        }

    def _show_view(self, view_key: str) -> None:
        """Swaps active view in the right-hand panel."""
        for key, view in self.views.items():
            if key == view_key:
                view.grid(row=0, column=1, sticky="nsew")
                view.refresh()
                self.nav_buttons[key].configure(
                    fg_color=COLOR_ACCENT_PRIMARY,
                    text_color=COLOR_TEXT_PRIMARY
                )
            else:
                view.grid_forget()
                self.nav_buttons[key].configure(
                    fg_color="transparent",
                    text_color=COLOR_TEXT_SECONDARY
                )

        self._refresh_sidebar_stats()

    def _on_data_synchronized(self) -> None:
        """Callback whenever food items, logs, or settings change."""
        self._refresh_sidebar_stats()
        # Refresh current view
        for view in self.views.values():
            if view.winfo_ismapped():
                view.refresh()

    def _refresh_sidebar_stats(self) -> None:
        settings = self.db.get_settings()
        eff = settings.get_effective_targets()
        self.lbl_side_weight.configure(text=f"Weight: {settings.weight_kg:.1f} kg")
        self.lbl_side_target.configure(text=f"Target: {int(eff['calories']):,} kcal/day")


def main() -> None:
    app = BulkingTrackerApp()
    app.mainloop()


if __name__ == "__main__":
    main()
