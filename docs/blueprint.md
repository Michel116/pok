# **App Name**: Порядок

## Core Features:

- Terminal Inventory Management: Maintain a central database of all terminals, tracking their location, status, and history.
- Interactive Shelf Visualization: Visually represent the warehouse shelves, allowing users to quickly locate terminals and understand warehouse occupancy.
- Lifecycle Tracking: Monitor each terminal's lifecycle stages: 'placed,' 'awaiting verification,' 'verified,' and 'shipped'.
- Verification Management: Manage terminals that require verification, including scheduling, recording dates, and integrating with external registries (ФГИС 'Аршин').
- Shipping History: Maintain a history of all shipments, including responsible person and date.
- Role-Based Access Control: Implement different user roles with restricted privileges (e.g., Administrator, Verifier).
- Database integration: Uses PostgreSQL with Prisma ORM.

## Style Guidelines:

- Primary color: Turquoise (#47A3A3), used for buttons, links, and key elements to attract attention and suggest action.
- Background color: Light gray (#F0F0F0) for a clean and unobtrusive backdrop.
- Accent color: Teal (#2A7A7A) to provide contrast for important UI elements.
- Body and headline font: 'Inter' (sans-serif) from Google Fonts, ensuring clear and consistent readability.
- Classic layout with a sidebar for main sections and a main content area. The sidebar offers quick access to key sections. A fully responsive interface that adapts to both large monitors and mobile devices.
- Simple and clear icons that visually represent each function within the system.
- Subtle animations for state transitions such as loading or successfully completing database transactions.