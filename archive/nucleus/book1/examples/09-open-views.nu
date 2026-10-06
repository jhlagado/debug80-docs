var numbers as u8[4] = [2, 4, 6, 8]
var message as string[12]
var observed as u16 = 0

sub sum(values as u8[]) as u16
    var index as u16
    var total as u16 = 0

    for index = 0 until values.length
        total = total + u16(values[index])
    end
    return total
end

sub writeOK(text as string[])
    text.length = 2
    text[0] = 'O'
    text[1] = 'K'
end

sub main()
    writeOK(message)
    observed = sum(numbers) + u16(message.length)
end
