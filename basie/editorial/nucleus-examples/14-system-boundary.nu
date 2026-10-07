var packet as u8[2] = [0, 0]
var observed as u16 = 0

sub hardwareExamples()
    packet[0] = readPort($00FF)
    writePort($00FF, packet[0])
    service(1, packet)
end

sub main()
    observed = packet.length
end
