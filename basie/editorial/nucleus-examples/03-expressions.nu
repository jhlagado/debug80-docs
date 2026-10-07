var left as i16 = -17
var right as i16 = 5
var mask as u8 = $5A
var observed as u16 = 0

sub main()
    if left < 0 and right > 0
        observed = u16(i16(left mod right) + 2)
        observed = observed + u16((not mask) xor $FF)
    end
end
