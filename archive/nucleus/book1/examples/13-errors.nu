const invalidValue = 7
var observed as u16 = 0

sub positive(value as i8) as u8 fails
    if value < 0
        fail invalidValue
    end
    return u8(value)
end

sub checked(value as i8) as u8 fails
    var result as u8 = positive(value) else fail
    return result
end

sub main()
    var code as u8

    observed = checked(-1) handle code
        observed = 100 + u16(code)
    end
end
