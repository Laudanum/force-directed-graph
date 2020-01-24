#!/bin/bash

echo $1

SIZE=`identify -format "%w %h" $1`

echo $SIZE

WIDTH=`echo $SIZE | cut -d " " -f 1`
HEIGHT=`echo $SIZE | cut -d " " -f 2`
echo WIDTH $WIDTH
echo HEIGHT $HEIGHT

if [ $HEIGHT -lt $WIDTH ]
then
	echo Wider than high
	SQUARE=$WIDTH
else
	SQUARE=$HEIGHT
fi
SQUARE=$SQUARE'x'$SQUARE
echo $SQUARE

composite -channel RGBA -gravity center -resize $SQUARE $1 'xc:none' _$1
