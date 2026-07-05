"""Safe CPython bytecode disassembler.

Uses the standard-library :mod:`dis` module to render human-readable bytecode
for a Python source file. This is a read-only analysis aid for understanding
control flow at the bytecode level.

**Safety:** ``compile(source, ..., "exec")`` produces a code object *without
executing it*. We only ever compile and disassemble -- we never ``exec`` the
result -- so untrusted source is never run.

**Memory:** disassembly text is produced lazily line-by-line via a generator so
large modules do not need to be buffered whole.
"""

from __future__ import annotations

import dis
from collections.abc import Iterator


def disassemble(source: str, filename: str = "<unknown>") -> Iterator[str]:
    """Yield formatted bytecode instruction lines for ``source``.

    Raises :class:`SyntaxError` if the source cannot be compiled.
    """
    code = compile(source, filename, "exec")
    bytecode = dis.Bytecode(code)
    yield f"; Disassembly of {filename}"
    yield f"; module-level code object: {code.co_name!r}"
    yield ""
    yield from _format_bytecode(bytecode, indent=0)

    # Recurse into nested code objects (functions, comprehensions, classes).
    yield from _disassemble_children(code, indent=1)


def _format_bytecode(bytecode: dis.Bytecode, indent: int) -> Iterator[str]:
    pad = "    " * indent
    for instr in bytecode:
        arg = "" if instr.argrepr == "" else f"  ({instr.argrepr})"
        marker = ">>" if instr.is_jump_target else "  "
        line = instr.starts_line if instr.starts_line is not None else ""
        yield f"{pad}{str(line):>4} {marker} {instr.offset:>4} {instr.opname:<24}{arg}"


def _disassemble_children(code, indent: int) -> Iterator[str]:
    for const in code.co_consts:
        if hasattr(const, "co_code"):  # a nested code object
            yield ""
            yield f"{'    ' * indent}; code object {const.co_name!r} "\
                  f"(line {const.co_firstlineno})"
            yield from _format_bytecode(dis.Bytecode(const), indent)
            yield from _disassemble_children(const, indent + 1)
