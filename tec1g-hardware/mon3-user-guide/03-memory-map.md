---
layout: default
title: "Memory Map"
parent: "MON-3 User Guide"
grand_parent: "TEC-1G Hardware"
nav_order: 3
has_toc: true
---

[← Main Menu](02-main-menu.md) | [Guide](index.md) | [Data Entry Mode →](04-data-entry-mode.md)

# Memory Map

![MON-3 illustration](../../assets/images/tec1g-hardware/mon3-user-guide/page-11-figure-1.png)

The table below outlines how the full 64Kb of address space is allocated on
the TEC-1G.

| Address | Contents | Type |
| --- | --- | --- |
| `0000H-00FFH` | Reserved for Z80 instructions | RAM |
| `0100H-07FFH` | PATA/SD Drive area or free RAM | RAM |
| `0800H-087FH` | Reserved for hardware stack | RAM |
| `0880H-0FFFH` | Reserved for monitor RAM | RAM |
| `1000H-3FFFH` | Free RAM | RAM |
| `4000H-7FFFH` | Free RAM (protected) | RAM |
| `8000H-BFFFH` | Expansion socket | RAM/ROM |
| `C000H-FFFFH` | Monitor ROM | ROM |

Some things to be considered are:

- Any RAM location can be updated, but it is highly recommended not to update Monitor Reserved RAM locations. This can/will cause undesirable effects on the running of the TEC. A Cold Reset will restore the TEC to its default running state (hopefully).
- The address range between <span class="mon3-address-emphasis">4000H-7FFFH</span> is a special area that can be made READ ONLY. This is called a Protected area. Protect mode can be switched on using the configuration 3-DIP switch. If protect is enabled and code is being executed. No RAM update can be done in this range. This feature is designed to protect keyed-in code from being inadvertently erased by a rogue routine.
- The Expansion Socket on the TEC can have a 32Kb ROM or RAM inserted. Only 16Kb can be accessed at one time. To switch between high and low memory use the Expand switch on the configuration 3-DIP switch. The switch can also be overridden in software by toggling the Expand flag in the Settings menu or pressing <span class="mon3-key-emphasis">Fn-E</span>.
- If the monitor ROM is a legacy monitor, IE: Mon1, Mon2, JMon or BMon, The address range <span class="mon3-address-emphasis">0000H-07FFH</span> will be READ ONLY and will emulate the same addressing that is used for that particular ROM. Shadow mode will be active by default and will be indicated by an illuminated LED segment on the system latch BAR component.

[← Main Menu](02-main-menu.md) | [Guide](index.md) | [Data Entry Mode →](04-data-entry-mode.md)
