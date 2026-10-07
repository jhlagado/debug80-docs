record Cell
    value as u16
    active as boolean
end

const defaultCell as Cell = (7, true)
const masks as u8[4] = [1, 2, 4, 8]
var current as Cell = defaultCell
var observed as u16 = 0

sub main()
    if current.active
        observed = current.value + defaultCell.value + u16(masks[3])
    end
end
