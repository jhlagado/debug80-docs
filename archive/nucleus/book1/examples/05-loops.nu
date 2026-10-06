var observed as u16 = 0

sub firstPositive(value as i8) as i8
    while true
        if value > 0
            return value
        end
        value = value + 1
    end
end

sub main()
    var index as i8

    for index = -3 to 3 step + (1 + 1)
        if index = -1
            continue
        elseif index = 3
            exit
        end
        observed = observed + 1
    end
    observed = observed + u16(firstPositive(-2))
end
