const rows = 4
const columns = $08
const enabled = true
const stepBack = -1
assert rows * columns = %100000

var observed as u16 = 0

sub main()
    if enabled
        observed = u16(rows * columns) + u16('A') + u16(i8(stepBack) + 1)
    end
end
