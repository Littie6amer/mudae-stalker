package main

import (
	"fmt"
	"github.com/bwmarrin/discordgo"
	"time"
)
it
func timers(client *discordgo.Session) {
	i := 0
	waitUntilNextMinute()
	fmt.Println("Starting loop.")
	for {
		i++
		msg := fmt.Sprintf("again x%d\n", i)
		_, err := client.ChannelMessageSend("1023170512895103036", msg)
		if err != nil {
			fmt.Println(err)
		}
		waitUntilNextMinute()
	}
}

func waitUntilNextMinute() {
	waitSecs := 60 - time.Now().Second()
	fmt.Printf("Waiting %d seconds\n", waitSecs)
	if waitSecs > 0 {
		time.Sleep(time.Duration(waitSecs) * time.Second)
	}
}
