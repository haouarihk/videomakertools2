# Helper tools to combine videos

## How to set it up

1- make sure you have ffmpeg installed, and added to path
to check if its installed run

```CMD
ffmpeg --version
```

2- install dependencies (using yarn)

```CMD
yarn
```

3- compile the code (using typescript)

```CMD
yarn compile
```

note: if you don't have `typescript` installed globally, make sure you do so
with the command

```CMD
npm install -g typescript
```

4- run it the first time, so that files will get generated

## How To Use

go to the dev folder, and you will see multiple folders

### clips: this is where your clips will go (mp4)

### intros: this is where your intros will go (mp4)

### voices: this is where the random voice over will be (mp3)

## The script should take random clips and random voices and make a video out of it
