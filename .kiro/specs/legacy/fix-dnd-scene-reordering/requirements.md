# Requirements Document: Fix Drag-and-Drop Scene Reordering

## Introduction

The storyboard's drag-and-drop feature for reordering scene cards is currently buggy, with cards not snapping into place correctly, creating broken grid layouts, and allowing cards to be dragged far sideways. This feature needs to be fixed to provide clean, intuitive reordering with proper snapping and stable grid layouts.

## Glossary

- **Scene Card**: A visual card component representing a single scene in the storyboard
- **DnD System**: The drag-and-drop system powered by @dnd-kit library
- **Storyboard Grid**: The CSS Grid layout containing scene cards
- **Sortable Context**: The @dnd-kit context that manages draggable items
- **Transform**: CSS transform applied to elements during drag operations
- **Drag Overlay**: A visual clone of the dragged item that follows the cursor
- **Collision Detection**: Algorithm that determines valid drop targets during drag
- **Sorting Strategy**: Algorithm that calculates item positions during reordering

## Requirements

### Requirement 1: Correct Sorting Strategy

**User Story:** As a user, I want scene cards to snap correctly into grid positions when I drag and drop them, so that reordering feels natural and predictable.

#### Acceptance Criteria

1. WHEN the user drags a scene card, THE Storyboard Grid SHALL use a rectangular sorting strategy appropriate for multi-column layouts
2. WHEN a scene card is dragged over another card's position, THE DnD System SHALL calculate the correct drop position based on 2D grid coordinates
3. WHEN a scene card is released, THE Scene Card SHALL snap to the nearest valid grid position without horizontal drift
4. WHEN the grid has multiple columns, THE DnD System SHALL correctly handle cross-column drag operations
5. WHERE the user drags a card vertically or horizontally, THE DnD System SHALL provide consistent snapping behavior

### Requirement 2: Proper Transform Application

**User Story:** As a user, I want dragged cards to move smoothly and return to their correct positions, so that the interface feels responsive and stable.

#### Acceptance Criteria

1. WHEN a scene card is being dragged, THE Scene Card SHALL apply position transforms via inline styles
2. WHEN a drag operation completes, THE Scene Card SHALL remove all drag-related transforms cleanly
3. WHEN drag is disabled, THE Scene Card SHALL not retain any transform properties from previous drag operations
4. THE Scene Card SHALL NOT manually manipulate DOM styles via useEffect for drag transforms
5. WHEN multiple rapid drags occur, THE Scene Card SHALL not exhibit "sticky" transforms or positioning artifacts

### Requirement 3: Visual Drag Feedback

**User Story:** As a user, I want clear visual feedback when dragging a scene card, so that I understand what I'm moving and where it will go.

#### Acceptance Criteria

1. WHEN the user starts dragging a scene card, THE DnD System SHALL display a drag overlay that follows the cursor
2. WHEN a card is being dragged, THE Drag Overlay SHALL render a visual preview of the scene card
3. WHEN a card is being dragged, THE Scene Card SHALL display reduced opacity in its original position
4. WHEN the drag operation ends, THE Drag Overlay SHALL disappear immediately
5. WHEN the user hovers over the drag handle, THE Scene Card SHALL display a grab cursor

### Requirement 4: Stable Grid Layout

**User Story:** As a user, I want the storyboard grid to maintain a consistent layout during drag operations, so that cards don't jump unexpectedly or create broken layouts.

#### Acceptance Criteria

1. THE Storyboard Grid SHALL maintain a predictable column count that does not change during drag operations
2. WHEN the viewport is resized, THE Storyboard Grid SHALL adjust column count only at defined breakpoints
3. WHEN cards are reordered, THE Storyboard Grid SHALL not create gaps or overlapping cards
4. THE Storyboard Grid SHALL constrain card width to prevent excessive horizontal stretching
5. WHEN a drag operation is in progress, THE Storyboard Grid SHALL maintain stable positioning for all non-dragged cards

### Requirement 5: Accurate Collision Detection

**User Story:** As a user, I want the system to correctly identify where I'm trying to drop a card, so that it goes to the intended position.

#### Acceptance Criteria

1. WHEN the user drags a card over another card, THE DnD System SHALL use rectangular intersection for collision detection
2. WHEN multiple valid drop targets exist, THE DnD System SHALL select the closest target based on 2D distance
3. WHEN a card is dragged near grid gaps, THE DnD System SHALL account for gap spacing in collision calculations
4. THE DnD System SHALL detect collisions accurately in both single-column and multi-column layouts
5. WHEN the user drags quickly, THE DnD System SHALL maintain accurate collision detection without lag

### Requirement 6: Stacked Group Handling

**User Story:** As a user, I want stacked groups to remain stable during drag operations, so that only individual scene cards can be reordered.

#### Acceptance Criteria

1. WHEN a group is stacked, THE Stacked Group Card SHALL NOT be included in the sortable context
2. WHEN individual scenes are visible, THE Scene Card SHALL be draggable and reorderable
3. WHEN a stacked group is present, THE DnD System SHALL only allow reordering of individual scene cards
4. THE Sortable Context SHALL contain only scene card IDs, not stacked group IDs
5. WHEN groups are toggled between stacked and expanded, THE DnD System SHALL update the sortable items list accordingly

### Requirement 7: Keyboard Accessibility

**User Story:** As a keyboard user, I want to reorder scene cards using keyboard controls, so that I can use the storyboard without a mouse.

#### Acceptance Criteria

1. WHEN the user focuses a drag handle, THE Scene Card SHALL indicate keyboard drag capability
2. WHEN the user presses arrow keys on a focused drag handle, THE Scene Card SHALL move to adjacent positions
3. WHEN the user presses Space or Enter on a drag handle, THE DnD System SHALL activate keyboard drag mode
4. WHEN keyboard drag is active, THE DnD System SHALL announce position changes to screen readers
5. WHEN the user presses Escape during a drag, THE DnD System SHALL cancel the operation and return the card to its original position

### Requirement 8: Drag State Management

**User Story:** As a user, I want drag operations to be disabled when scene card panels (edit/animate) are open on a specific card, but remain enabled when the manager drawer is open, so that I don't accidentally reorder cards while editing but can still organize my storyboard while managing scene properties.

#### Acceptance Criteria

1. WHEN an edit panel is open on a scene card, THE Scene Card SHALL disable drag functionality for that specific card
2. WHEN an animate panel is open on a scene card, THE Scene Card SHALL disable drag functionality for that specific card
3. WHEN drag is disabled on a card, THE Scene Card SHALL not display drag handles or grab cursors for that card
4. WHEN a scene card panel is closed, THE Scene Card SHALL re-enable drag functionality
5. WHEN the manager drawer is open, THE DnD System SHALL keep drag functionality enabled for all scene cards
6. WHEN filters are active, THE DnD System SHALL allow reordering of visible filtered scenes

### Requirement 9: Performance and Responsiveness

**User Story:** As a user, I want drag operations to feel smooth and responsive, so that the interface doesn't feel sluggish.

#### Acceptance Criteria

1. WHEN the user drags a scene card, THE DnD System SHALL update position at 60fps minimum
2. WHEN the storyboard contains 50+ scenes, THE DnD System SHALL maintain smooth drag performance
3. THE Scene Card SHALL use memoization to prevent unnecessary re-renders during drag
4. WHEN a drag operation completes, THE DnD System SHALL update the scene order within 100ms
5. THE Storyboard Grid SHALL use CSS transforms for positioning to leverage GPU acceleration

### Requirement 10: Error Recovery

**User Story:** As a user, I want the system to recover gracefully if a drag operation fails, so that my storyboard doesn't get into a broken state.

#### Acceptance Criteria

1. IF a drag operation is interrupted, THEN THE DnD System SHALL return the card to its original position
2. IF the reorder API call fails, THEN THE DnD System SHALL revert the visual reorder and display an error message
3. IF the user drags outside the storyboard area, THEN THE DnD System SHALL cancel the drag operation
4. WHEN a drag is cancelled, THE Scene Card SHALL restore all original styles and positioning
5. IF multiple users reorder scenes simultaneously, THEN THE DnD System SHALL handle conflicts by refreshing the scene list
