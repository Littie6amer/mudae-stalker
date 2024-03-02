package main

import (
	"fmt"
	"github.com/bwmarrin/discordgo"
	"github.com/gofor-little/env"
	"os"
	"os/signal"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
)

var CommandPrefix string

func main() {
	if err := env.Load("./.env"); err != nil {
		panic(err)
	}

	botToken, err := env.MustGet("BOT_TOKEN")
	if err != nil {
		panic(err)
	}

	client, err := discordgo.New("Bot " + botToken)
	if err != nil {
		panic(err)
	}

	client.Identify.Intents = discordgo.IntentsGuildMessages

	CommandPrefix = "$"
	client.AddHandler(messageCreate)

	err = client.Open()
	if err != nil {
		panic(err)
	}

	println("Ready! Logged in as", client.State.User.Username)

	//go timers(client)
	_ = client.UpdateWatchStatus(0, "👀")

	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-sc

	_ = client.Close()
}

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

func messageCreate(client *discordgo.Session, message *discordgo.MessageCreate) {
	if message.Author.ID == "432610292342587392" {
		mudaeMessageHandler(client, message)
		return
	}

	if message.Author.Bot || !strings.HasPrefix(message.Content, CommandPrefix) {
		return
	}

	args := strings.Split(message.Content[len(CommandPrefix):], " ")
	command := args[0]
	args = args[1:]

	switch command {
	case "hello":
		client.ChannelMessageSendReply(message.ChannelID, "Hi!", message.Reference())
		return
	}
}

func mudaeMessageHandler(client *discordgo.Session, message *discordgo.MessageCreate) {
	if len(message.Content) > 0 {
		match := regexp.MustCompile("next rolls reset in \\*\\*[0-9]([0-9]|)\\*\\* min").FindString(strings.ToLower(message.Content))

		if match != "" {
			match = regexp.MustCompile("([0-9][0-9]|[0-9])").FindString(match)
			num, err := strconv.Atoi(match)

			if err != nil {
				fmt.Println(err)
				return
			}

			t := time.Now()
			offset := t.Minute() + num
			if offset > 60 {
				offset -= 60
			}
			if t.Second() <= 1 {
				offset -= 1
			}

			client.ChannelMessageSendReply(message.ChannelID, fmt.Sprintf("Found %d, offset is %d", num, offset), message.Reference())
		}
	} else if len(message.Embeds) > 0 && message.Embeds[0].Description != "" {

	}

}
