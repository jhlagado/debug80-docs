var direction as i8 = -1
var observed as u16 = 0

sub main()
    if direction > 0
        observed = 1
    elseif direction < 0
        observed = 2
    else
        observed = 3
    end

    select direction
    case -1
        observed = observed + 10
    case 0
        observed = observed + 20
    else
        observed = observed + 30
    end
end
