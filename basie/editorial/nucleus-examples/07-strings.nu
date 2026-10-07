var source as string[6] = "A\0B"
var copy as string[6]
var observed as u16 = 0

sub main()
    copy = source
    copy[2] = 'C'
    observed = u16(copy.length) * 100 + u16(copy[0]) + u16(copy[2])
end
