/**
 * questions.js — Starter code templates for each dungeon room.
 *
 * Keys are `room_order` numbers (1-based).
 * Problem statements ALWAYS come from Supabase (source of truth).
 * This file only provides: language and starter code template.
 *
 * To change a room's starter code, edit here — no backend changes needed.
 */

export const ROOM_STARTERS = {
  1: {
    language: 'cpp',
    starterCode: `#include <iostream>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`,
  },
  2: {
    language: 'cpp',
    starterCode: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`,
  },
  3: {
    language: 'cpp',
    starterCode: `#include <iostream>
#include <string>
#include <algorithm>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`,
  },
  4: {
    language: 'cpp',
    starterCode: `#include <iostream>
#include <vector>
#include <map>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`,
  },
  5: {
    language: 'cpp',
    starterCode: `#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;

int main() {
    // Boss Chamber — Write your final solution here

    return 0;
}`,
  },
};

/**
 * Get starter code for a room by its order number.
 * Falls back to a generic template if room_order not found.
 */
export function getStarterCode(roomOrder) {
  const entry = ROOM_STARTERS[roomOrder];
  if (entry) return entry.starterCode;
  return `#include <iostream>
using namespace std;

int main() {
    // Write your solution here

    return 0;
}`;
}

export function getRoomLanguage(roomOrder) {
  return ROOM_STARTERS[roomOrder]?.language || 'cpp';
}
